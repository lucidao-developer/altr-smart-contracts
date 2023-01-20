// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "./interfaces/ILicenseManager.sol";
import "./interfaces/IStakingService.sol";

/**
 * @title AltrLicenseManager
 * @author Lucidao Developer
 * @dev This contract serves as a license manager for a software system. It allows for the owner to set
 * discounts for individual users and track conventions for each oracle. It also allows for the owner to
 * set the staking service and staked tokens required for oracle eligibility.
 */
contract AltrLicenseManager is Ownable, ERC165, ILicenseManager {
	using ERC165Checker for address;

	/**
	 * @dev mapping to store conventions for each oracle
	 */
	mapping(address => uint256) public conventions;

	/**
	 * @dev constant variable to define minimum discount
	 */
	uint256 public constant MIN_DISCOUNT = 0;

	/**
	 * @dev constant variable to define maximum discount
	 */
	uint256 public constant MAX_DISCOUNT = 9000;

	/**
	 * @dev staking service address
	 */
	address public stakingService;

	/**
	 * @dev staking service pool id
	 */
	uint256 public stakingServicePid;

	/**
	 * @dev staked tokens for oracle eligibility
	 */
	uint256 public stakedTokensForOracleEligibility;

	/**
	 * @dev Event emitted when a user's discount is set
	 * @param user Address of the user whose discount is being set
	 * @param discount The discount being set for the user
	 */
	event DiscountSet(address indexed user, uint256 discount);

	/**
	 * @dev Event emitted when the staking service address is set
	 * @param stakingService Address of the staking service
	 * @param stakingServicePid The pool id of the staking service
	 */
	event StakingServiceSet(address indexed stakingService, uint256 indexed stakingServicePid);

	/**
	 * @dev Event emitted when the staking service pool id is set
	 * @param pid The pool id of the staking service
	 */
	event StakingServicePidSet(uint256 indexed pid);

	/**
	 * @dev Event emitted when the amount of staked tokens required for oracle eligibility is set
	 * @param amount The amount of staked tokens required for oracle eligibility
	 */
	event StakedTokensForOracleEligibilitySet(uint256 indexed amount);

	/**
	 * @dev Constructor to initialize the staking service and staked tokens for oracle eligibility.
	 * @param stakingService_ The address of the staking service.
	 * @param stakingServicePid_ The pool id of the staking service.
	 * @param _stakedTokensForOracleEligibility The number of tokens required for oracle eligibility.
	 */
	constructor(address stakingService_, uint256 stakingServicePid_, uint256 _stakedTokensForOracleEligibility) {
		_setStakingService(stakingService_, stakingServicePid_);
		stakedTokensForOracleEligibility = _stakedTokensForOracleEligibility;
	}

	/**
	 * @dev Allows the owner of the contract to set a discount for a given user
	 * @param user Address of the user for which the discount will be set
	 * @param discount Amount of the discount for the user (in percents)
	 */
	function setDiscount(address user, uint256 discount) external onlyOwner {
		require(discount > MIN_DISCOUNT && discount <= MAX_DISCOUNT, "AltrLicenseManager: discount not in accepted range");
		conventions[user] = discount;

		emit DiscountSet(user, discount);
	}

	/**
	 * @dev Allows the owner of the contract to set the staking service
	 * @param stakingService_ address of the staking service
	 * @param pid_ pool id of the staking service
	 */
	function setStakingService(address stakingService_, uint256 pid_) external onlyOwner {
		_setStakingService(stakingService_, pid_);

		emit StakingServiceSet(stakingService_, pid_);
	}

	/**
	 * @dev Allows the owner of the contract to set the required staked tokens for an oracle to be qualified
	 * @param amount minimum amount of staked tokens
	 */
	function setStakedTokensForOracleEligibility(uint256 amount) external onlyOwner {
		stakedTokensForOracleEligibility = amount;

		emit StakedTokensForOracleEligibilitySet(amount);
	}

	/**
	 * @dev returns the discount for a given user
	 * @param user Address of the user for which the discount will be retrieved
	 * @return discount Amount of the discount for the user (in percents)
	 */

	function getDiscount(address user) external view override returns (uint256) {
		return conventions[user];
	}

	/**
	 * @dev returns true if the oracle has the minimum required staked tokens
	 * @param oracle address of the oracle
	 * @return bool returns true if the oracle is qualified
	 */
	function isAQualifiedOracle(address oracle) external view virtual returns (bool) {
		uint256 stakedTokens = IStakingService(stakingService).userInfo(stakingServicePid, oracle);
		if (stakedTokens < stakedTokensForOracleEligibility) return false;
		return true;
	}

	/**
	 * @dev Check if a given address supports the ILicenseManager interface
	 * @param interfaceId 4 bytes long ID of the interface to check
	 * @return bool returns true if the address implements the interface
	 */
	function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
		return interfaceId == type(ILicenseManager).interfaceId || super.supportsInterface(interfaceId);
	}

	/**
	 * @dev This function is responsible for setting the staking service for AltrLicenseManager. The address passed as an argument must not be a null address and must support the IStakingService interface
	 *
	 * @param stakingService_ the address of the contract implementing the IStakingService interface
	 * @param pid_ the pool id of the staking service
	 */
	function _setStakingService(address stakingService_, uint256 pid_) internal {
		require(stakingService_ != address(0), "AltrLicenseManager: cannot be null address");
		require(stakingService_.supportsInterface(type(IStakingService).interfaceId), "AltrLicenseManager: does not support IStakingService interface");

		address stakingToken = IStakingService(stakingService_).poolStakingToken(pid_);
		require(stakingToken != address(0), "AltrLicenseManager: pool id not valid");

		stakingServicePid = pid_;
		stakingService = stakingService_;
	}
}
