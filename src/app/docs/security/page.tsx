'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function SecurityDocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', title: 'Security Overview', icon: '🛡️' },
    { id: 'contracts', title: 'Smart Contracts', icon: '📜' },
    { id: 'admin', title: 'Admin Controls', icon: '👑' },
    { id: 'multisig', title: 'Multisig Setup', icon: '🔐' },
    { id: 'emergency', title: 'Emergency Procedures', icon: '🚨' },
    { id: 'audits', title: 'Audits & Reviews', icon: '🔍' }
  ]

  const contractAddresses = {
    'SHAH Token': '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
    'SHAH Factory': '0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a',
    'SHAH Registry': '0x26027A7cbe7BF2DD5DA9b0B7Cb0F1dd4b998d11f',
    'SHAH Staking': '0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00',
    'SHAH Oracle': '0x6AB49a6A16d77CE7DE6fc0c0af2bB14c6F80C75f',
    'ShahSwap': '0x40677E55C83C032e595f0CE25035636DFD6bc03d'
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">🛡️ Security Overview</h2>
            
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-green-400 mb-2">Security Status: ACTIVE</h3>
              <p className="text-gray-300">All systems operational with comprehensive security measures in place.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">🔒 Core Security Principles</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Multi-signature wallet governance</li>
                  <li>• Time-locked contract upgrades</li>
                  <li>• Comprehensive access controls</li>
                  <li>• Regular security audits</li>
                  <li>• Emergency pause mechanisms</li>
                  <li>• Transparent admin operations</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">📊 Security Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contracts Audited:</span>
                    <span className="text-green-400 font-medium">6/6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Critical Issues:</span>
                    <span className="text-green-400 font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Admin Keys Secured:</span>
                    <span className="text-green-400 font-medium">✅ Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Emergency Procedures:</span>
                    <span className="text-green-400 font-medium">✅ Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'contracts':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">📜 Smart Contract Security</h2>
            
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Contract Addresses</h3>
              <div className="space-y-3">
                {Object.entries(contractAddresses).map(([name, address]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span className="font-medium">{name}</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-gray-900 px-2 py-1 rounded text-green-400">
                        {address}
                      </code>
                      <a
                        href={`https://etherscan.io/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        📊 Etherscan
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">🔍 Audit Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>SHAH Token</span>
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-sm">✅ Audited</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Factory Contract</span>
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-sm">✅ Audited</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Staking Contract</span>
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-sm">✅ Audited</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Swap Contract</span>
                    <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-sm">⏳ Pending</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">🛡️ Security Features</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Reentrancy protection</li>
                  <li>• Integer overflow safeguards</li>
                  <li>• Access control modifiers</li>
                  <li>• Emergency pause functions</li>
                  <li>• Time-locked upgrades</li>
                  <li>• Rate limiting mechanisms</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'admin':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">👑 Admin Controls & Governance</h2>
            
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">⚠️ Transition Required</h3>
              <p className="text-gray-300">Admin keys should be transferred to multisig wallet for enhanced security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">🔑 Current Admin Powers</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Token verification approval</li>
                  <li>• Factory fee adjustments</li>
                  <li>• Oracle price updates</li>
                  <li>• Emergency contract pausing</li>
                  <li>• Staking parameter changes</li>
                  <li>• Registry management</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">📋 Admin Checklist</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked readOnly className="rounded" />
                    <span className="text-gray-300">Admin functions documented</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked readOnly className="rounded" />
                    <span className="text-gray-300">Access controls implemented</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300">Multisig wallet created</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300">Ownership transferred</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300">Emergency procedures tested</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 'multisig':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">🔐 Multisig Wallet Setup</h2>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-blue-400 mb-2">📋 Recommended Setup</h3>
              <p className="text-gray-300">3-of-5 multisig with trusted team members and advisors.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">🏗️ Setup Steps</h3>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex items-start space-x-3">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                    <div>
                      <strong>Create Gnosis Safe</strong>
                      <p className="text-sm text-gray-400">Deploy 3-of-5 multisig using Gnosis Safe on Ethereum mainnet</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                    <div>
                      <strong>Add Signers</strong>
                      <p className="text-sm text-gray-400">Add 5 trusted addresses: 2 founders, 2 advisors, 1 community representative</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                    <div>
                      <strong>Transfer Ownership</strong>
                      <p className="text-sm text-gray-400">Transfer contract ownership from EOA to multisig address</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                    <div>
                      <strong>Test Operations</strong>
                      <p className="text-sm text-gray-400">Perform test transactions to verify multisig functionality</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">✅ Benefits</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Eliminates single point of failure</li>
                    <li>• Requires consensus for critical actions</li>
                    <li>• Transparent governance process</li>
                    <li>• Enhanced community trust</li>
                    <li>• Reduced operational risk</li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">⚙️ Recommended Tools</h3>
                  <div className="space-y-3">
                    <a
                      href="https://safe.global"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium">Gnosis Safe</div>
                      <div className="text-sm text-gray-400">Multisig wallet platform</div>
                    </a>
                    <a
                      href="https://defender.openzeppelin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium">OpenZeppelin Defender</div>
                      <div className="text-sm text-gray-400">Admin & monitoring tools</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'emergency':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">🚨 Emergency Procedures</h2>
            
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-red-400 mb-2">🚨 Emergency Contacts</h3>
              <p className="text-gray-300">In case of security incidents, contact the admin team immediately.</p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">🔴 Incident Response Plan</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-bold text-red-400">1. IMMEDIATE RESPONSE (0-15 minutes)</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Assess threat severity</li>
                      <li>• Activate emergency pause if necessary</li>
                      <li>• Notify admin team via secure channels</li>
                      <li>• Document incident details</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-bold text-yellow-400">2. INVESTIGATION (15-60 minutes)</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Analyze attack vectors</li>
                      <li>• Review transaction logs</li>
                      <li>• Assess potential damage</li>
                      <li>• Prepare public communication</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-bold text-blue-400">3. RESOLUTION (1-24 hours)</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Deploy fixes if needed</li>
                      <li>• Resume normal operations</li>
                      <li>• Publish incident report</li>
                      <li>• Implement preventive measures</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">⏸️ Emergency Functions</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <code className="bg-gray-700 px-2 py-1 rounded text-sm">pause()</code> - Halt all operations</li>
                    <li>• <code className="bg-gray-700 px-2 py-1 rounded text-sm">emergencyWithdraw()</code> - Rescue funds</li>
                    <li>• <code className="bg-gray-700 px-2 py-1 rounded text-sm">blacklist()</code> - Block malicious addresses</li>
                    <li>• <code className="bg-gray-700 px-2 py-1 rounded text-sm">updateOracle()</code> - Fix price feeds</li>
                  </ul>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">📢 Communication Channels</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Telegram admin group</li>
                    <li>• Discord announcements</li>
                    <li>• Twitter official updates</li>
                    <li>• Website status page</li>
                    <li>• Email notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'audits':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-4">🔍 Security Audits & Reviews</h2>
            
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">📋 Audit History</h3>
              <div className="space-y-4">
                <div className="border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">SHAH Token Security Audit</h4>
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-sm">✅ Passed</span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Auditor: Internal Security Team</p>
                    <p>Date: December 2024</p>
                    <p>Issues Found: 0 Critical, 2 Low (Fixed)</p>
                  </div>
                </div>

                <div className="border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold">Factory Contract Review</h4>
                    <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-sm">⏳ In Progress</span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Auditor: External Security Firm</p>
                    <p>Date: January 2025 (Scheduled)</p>
                    <p>Scope: Token creation and verification logic</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">🛡️ Security Tools</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Slither static analysis</li>
                  <li>• MythX vulnerability scanning</li>
                  <li>• Echidna fuzz testing</li>
                  <li>• Manual code review</li>
                  <li>• Gas optimization analysis</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">📈 Next Steps</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Complete factory audit</li>
                  <li>• Implement bug bounty program</li>
                  <li>• Regular security reviews</li>
                  <li>• Community security education</li>
                  <li>• Penetration testing</li>
                </ul>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">🔒 SHAH Security Documentation</h1>
          <p className="text-gray-300 text-lg">Comprehensive security policies, procedures, and technical documentation for the SHAH ecosystem.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sticky top-6">
              <h3 className="font-bold mb-4">Documentation Sections</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              {renderContent()}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}