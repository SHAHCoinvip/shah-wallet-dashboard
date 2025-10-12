import { Bell, Moon, Sun, Mail, MessageSquare, Sliders as SliderIcon, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { useState } from 'react';

export function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [telegramNotifications, setTelegramNotifications] = useState(false);
  const [priceThreshold, setPriceThreshold] = useState([25]);

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Settings & Alerts</h1>
        <p style={{ color: '#A1A1AA' }}>Customize your SHAH Wallet experience</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Appearance */}
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              {darkMode ? <Moon className="w-5 h-5" style={{ color: '#D4AF37' }} /> : <Sun className="w-5 h-5" style={{ color: '#D4AF37' }} />}
            </div>
            <div>
              <h2 className="text-lg" style={{ color: '#F1F1F1' }}>Appearance</h2>
              <p className="text-sm" style={{ color: '#A1A1AA' }}>Customize the look and feel</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5" style={{ color: '#A1A1AA' }} />
                <div>
                  <Label style={{ color: '#F1F1F1' }}>Dark Mode</Label>
                  <p className="text-xs" style={{ color: '#A1A1AA' }}>Enable dark theme</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <Bell className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <h2 className="text-lg" style={{ color: '#F1F1F1' }}>Notifications</h2>
              <p className="text-sm" style={{ color: '#A1A1AA' }}>Manage how you receive alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" style={{ color: '#A1A1AA' }} />
                <div>
                  <Label style={{ color: '#F1F1F1' }}>Email Notifications</Label>
                  <p className="text-xs" style={{ color: '#A1A1AA' }}>Receive updates via email</p>
                </div>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" style={{ color: '#A1A1AA' }} />
                <div>
                  <Label style={{ color: '#F1F1F1' }}>Telegram Notifications</Label>
                  <p className="text-xs" style={{ color: '#A1A1AA' }}>Connect Telegram bot for alerts</p>
                </div>
              </div>
              <Switch checked={telegramNotifications} onCheckedChange={setTelegramNotifications} />
            </div>

            {telegramNotifications && (
              <div className="p-4 rounded-lg ml-12" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Label className="text-sm mb-2" style={{ color: '#3B82F6' }}>Telegram Bot ID</Label>
                <Input
                  placeholder="Enter your Telegram Bot ID"
                  className="mt-2"
                  style={{ background: '#0A0A0A', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#F1F1F1' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Price Alerts */}
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <SliderIcon className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <h2 className="text-lg" style={{ color: '#F1F1F1' }}>Price Alerts</h2>
              <p className="text-sm" style={{ color: '#A1A1AA' }}>Set custom price movement alerts</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" style={{ color: '#A1A1AA' }} />
                <div>
                  <Label style={{ color: '#F1F1F1' }}>Enable Price Alerts</Label>
                  <p className="text-xs" style={{ color: '#A1A1AA' }}>Get notified of price changes</p>
                </div>
              </div>
              <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
            </div>

            {priceAlerts && (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
                <div className="flex justify-between items-center mb-4">
                  <Label style={{ color: '#F1F1F1' }}>Alert Threshold</Label>
                  <div className="px-3 py-1 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37' }}>
                    ±{priceThreshold[0]}%
                  </div>
                </div>
                
                <Slider
                  value={priceThreshold}
                  onValueChange={setPriceThreshold}
                  min={5}
                  max={50}
                  step={5}
                  className="mb-2"
                />
                
                <div className="flex justify-between text-xs" style={{ color: '#A1A1AA' }}>
                  <span>5%</span>
                  <span>50%</span>
                </div>
                
                <p className="text-xs mt-3" style={{ color: '#A1A1AA' }}>
                  You'll be notified when SHAH token price moves ±{priceThreshold[0]}% from current price
                </p>
              </div>
            )}

            {priceAlerts && (
              <div className="space-y-3">
                <Label style={{ color: '#F1F1F1' }}>Custom Price Targets</Label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <Label className="text-xs mb-2" style={{ color: '#10B981' }}>Target High</Label>
                    <Input
                      placeholder="$5.00"
                      className="mt-1"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#F1F1F1' }}
                    />
                  </div>
                  
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <Label className="text-xs mb-2" style={{ color: '#EF4444' }}>Target Low</Label>
                    <Input
                      placeholder="$2.50"
                      className="mt-1"
                      style={{ background: '#0A0A0A', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F1F1F1' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Settings */}
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <SliderIcon className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <h2 className="text-lg" style={{ color: '#F1F1F1' }}>Transaction Settings</h2>
              <p className="text-sm" style={{ color: '#A1A1AA' }}>Configure default transaction parameters</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label style={{ color: '#F1F1F1' }}>Default Slippage Tolerance</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['0.1%', '0.5%', '1%', 'Custom'].map((value, index) => (
                  <button
                    key={index}
                    className={`py-2 px-4 rounded-lg transition-all ${index === 1 ? 'gold-gradient text-black' : ''}`}
                    style={{
                      background: index === 1 ? undefined : 'rgba(10, 10, 10, 0.5)',
                      border: `1px solid ${index === 1 ? 'transparent' : 'rgba(212, 175, 55, 0.2)'}`,
                      color: index === 1 ? undefined : '#F1F1F1',
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label style={{ color: '#F1F1F1' }}>Default Gas Price</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['Slow', 'Normal', 'Fast'].map((speed, index) => (
                  <button
                    key={index}
                    className={`py-3 px-4 rounded-lg transition-all ${index === 1 ? 'gold-gradient text-black' : ''}`}
                    style={{
                      background: index === 1 ? undefined : 'rgba(10, 10, 10, 0.5)',
                      border: `1px solid ${index === 1 ? 'transparent' : 'rgba(212, 175, 55, 0.2)'}`,
                      color: index === 1 ? undefined : '#F1F1F1',
                    }}
                  >
                    <div>{speed}</div>
                    <div className="text-xs opacity-70">
                      {index === 0 ? '~30s' : index === 1 ? '~15s' : '~5s'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button className="w-full h-14 text-lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
          <Save className="w-5 h-5 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
