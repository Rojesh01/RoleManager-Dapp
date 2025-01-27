"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import ContractAddress from "../contracts/contract-address.json";
import abi from "../contracts/UserRoleManager.json";

const roleManagerAddress = ContractAddress.UserRoleManager;
const contractABI = abi.abi;
const SEPOLIA_NETWORK_ID = "11155111";

enum UserRole {
  UNASSIGNED,
  MEMBER,
  ADMIN
}

export default function Home() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [accounts, setAccounts] = useState("None");
  const [roleAddress, setRoleAddress] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.UNASSIGNED);

  useEffect(() => {
    const connectWallet = async () => {
      try {
        const { ethereum } = window as any;

        if (ethereum) {
          if (ethereum.networkVersion === SEPOLIA_NETWORK_ID) {
            const accounts = await ethereum.request({
              method: "eth_requestAccounts"
            });

            const provider = new ethers.BrowserProvider(ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
              roleManagerAddress,
              contractABI,
              signer
            );

            setAccounts(accounts[0]);
            setContract(contract);

            // Check admin status
            const adminStatus = await contract.isAdmin(accounts[0]);
            setIsAdmin(adminStatus);

            // Get user's role
            const currentRole = await contract.myRole();
            setUserRole(currentRole);

            // Load initial roles
            const userCount = await contract.totalMembers();
            const loadedRoles = [];
            
            for (let i = 0; i < userCount; i++) {
              const userAddress = await contract.getMemberAddress(i);
              const user = await contract.users(userAddress);
              loadedRoles.push({
                name: UserRole[user.role],
                address: userAddress,
                isRegistered: user.isRegistered
              });
            }
            setRoles(loadedRoles);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    
    connectWallet();
  }, []);

  const handleGrantRole = async () => {
    if (!contract) return;
    
    try {
      const roleEnum = roleName.toUpperCase() === "ADMIN" 
        ? UserRole.ADMIN 
        : UserRole.MEMBER;
      
      const tx = await contract.addMember(roleAddress, roleEnum);
      await tx.wait();
      
      // Refresh roles
      const userCount = await contract.totalMembers();
      const updatedRoles = [];
      
      for (let i = 0; i < userCount; i++) {
        const userAddress = await contract.getMemberAddress(i);
        const user = await contract.users(userAddress);
        updatedRoles.push({
          name: UserRole[user.role],
          address: userAddress,
          isRegistered: user.isRegistered
        });
      }
      setRoles(updatedRoles);
      setRoleAddress("");
      setRoleName("");
    } catch (error) {
      console.error("Error granting role:", error);
    }
  };

  const handleRevokeRole = async (address: string) => {
    if (!contract) return;
    
    try {
      const tx = await contract.removeMember(address);
      await tx.wait();
      
      // Refresh roles
      const updatedRoles = roles.map(role => {
        if (role.address === address) {
          return { ...role, name: "UNASSIGNED", isRegistered: false };
        }
        return role;
      });
      setRoles(updatedRoles);
    } catch (error) {
      console.error("Error revoking role:", error);
    }
  };

  const handleJoinCommunity = async () => {
    if (!contract) return;
    
    try {
      const tx = await contract.joinCommunity();
      await tx.wait();
      window.location.reload(); // Refresh to update state
    } catch (error) {
      console.error("Error joining community:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Role Manager DApp</h1>
        <p className="text-sm mb-4">Connected Account: {accounts}</p>
        <p className="text-sm mb-6">Your Role: {UserRole[userRole]}</p>

        {!roles.some(role => role.address === accounts) && (
          <div className="mb-6">
            <button
              onClick={handleJoinCommunity}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Join Community
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Grant Role</h2>
            <input
              type="text"
              className="w-full p-2 mb-2 border rounded"
              placeholder="Wallet address"
              value={roleAddress}
              onChange={(e) => setRoleAddress(e.target.value)}
            />
            <select
              className="w-full p-2 mb-2 border rounded"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            >
              <option value="">Select Role</option>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={handleGrantRole}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Grant Role
            </button>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Community Members</h2>
          {roles.filter(role => role.isRegistered).map((role, index) => (
            <div key={index} className="flex justify-between items-center mb-2 p-2 bg-gray-50 rounded">
              <div>
                <p className="text-sm font-medium">{role.name}</p>
                <p className="text-xs text-gray-500">{role.address}</p>
              </div>
              {isAdmin && role.name === "MEMBER" && (
                <button
                  onClick={() => handleRevokeRole(role.address)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}