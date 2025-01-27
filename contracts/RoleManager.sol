// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRoleManager {
    enum Role {
        UNASSIGNED,
        MEMBER,
        ADMIN
    }

    struct User {
        address userAddress;
        Role role;
        bool isRegistered;
    }

    mapping(address => User) public users;
    address[] public userAddresses;

    event UserRegistered(address indexed userAddress, Role role);
    event RoleChanged(address indexed userAddress, Role newRole);

    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.ADMIN, "Unauthorized: Admins only");
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }

    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }

    constructor() {
        _registerUser(msg.sender, Role.ADMIN);
    }

    // Public self-registration function (becomes UNASSIGNED by default)
    function joinCommunity() external {
        require(!users[msg.sender].isRegistered, "Already registered");
        _registerUser(msg.sender, Role.UNASSIGNED);
    }

    // Admin: Add new member with specific role
    function addMember(address _userAddress, Role _role) external onlyAdmin {
        _registerUser(_userAddress, _role);
    }

    // Admin: Update existing user's role
    function updateRole(address _userAddress, Role _newRole) external onlyAdmin {
        require(users[_userAddress].isRegistered, "User not found");
        require(_newRole != Role.UNASSIGNED, "Use removeMember instead");
        
        users[_userAddress].role = _newRole;
        emit RoleChanged(_userAddress, _newRole);
    }

    // Admin: Remove user membership
    function removeMember(address _userAddress) external onlyAdmin {
        require(users[_userAddress].isRegistered, "User not found");
        
        delete users[_userAddress];
        emit RoleChanged(_userAddress, Role.UNASSIGNED);
    }

    // Get user's own role
    function myRole() external view returns (Role) {
        return users[msg.sender].role;
    }

    // Check if user is admin
    function isAdmin(address _userAddress) external view returns (bool) {
        return users[_userAddress].role == Role.ADMIN;
    }

    // Internal registration function
    function _registerUser(address _userAddress, Role _role) internal {
        require(!users[_userAddress].isRegistered, "User already registered");
        
        users[_userAddress] = User({
            userAddress: _userAddress,
            role: _role,
            isRegistered: true
        });
        userAddresses.push(_userAddress);
        
        emit UserRegistered(_userAddress, _role);
    }

    // Additional helper functions
    function totalMembers() external view returns (uint256) {
        return userAddresses.length;
    }

    function getMemberAddress(uint256 index) external view returns (address) {
        require(index < userAddresses.length, "Index out of bounds");
        return userAddresses[index];
    }
}