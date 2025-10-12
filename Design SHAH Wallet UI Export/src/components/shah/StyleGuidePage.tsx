import { Palette, Type, Square, Circle, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

export function StyleGuidePage() {
  const colors = [
    { name: 'Primary BG', hex: '#0A0A0A', var: '--shah-bg-primary' },
    { name: 'Card BG', hex: '#111111', var: '--shah-bg-card' },
    { name: 'Gold', hex: '#D4AF37', var: '--shah-gold' },
    { name: 'Blue', hex: '#3B82F6', var: '--shah-blue' },
    { name: 'Text Primary', hex: '#F1F1F1', var: '--shah-text-primary' },
    { name: 'Text Muted', hex: '#A1A1AA', var: '--shah-text-muted' },
  ];

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl mb-4" style={{ color: '#F1F1F1' }}>SHAH Wallet</h1>
        <h2 className="text-2xl mb-2" style={{ color: '#D4AF37' }}>Design System</h2>
        <p style={{ color: '#A1A1AA' }}>A comprehensive style guide for the SHAH Wallet ecosystem</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Color Palette */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Palette className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl" style={{ color: '#F1F1F1' }}>Color Palette</h2>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {colors.map((color, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(17, 17, 17, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(212, 175, 55, 0.1)',
                }}
              >
                <div
                  className="w-full h-24 rounded-lg mb-4"
                  style={{ background: color.hex, border: '2px solid rgba(212, 175, 55, 0.2)' }}
                />
                <div className="text-lg mb-2" style={{ color: '#F1F1F1' }}>{color.name}</div>
                <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>{color.hex}</div>
                <div className="text-xs" style={{ color: '#A1A1AA' }}>{color.var}</div>
              </div>
            ))}
          </div>

          {/* Gradients */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
              }}
            >
              <div
                className="w-full h-24 rounded-lg mb-4"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)',
                  border: '2px solid rgba(212, 175, 55, 0.2)',
                }}
              />
              <div className="text-lg mb-2" style={{ color: '#F1F1F1' }}>Gold Gradient</div>
              <div className="text-sm" style={{ color: '#A1A1AA' }}>
                linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)
              </div>
            </div>

            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
              }}
            >
              <div
                className="w-full h-24 rounded-lg mb-4"
                style={{
                  background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
                  border: '2px solid rgba(212, 175, 55, 0.2)',
                }}
              />
              <div className="text-lg mb-2" style={{ color: '#F1F1F1' }}>Radial Glow</div>
              <div className="text-sm" style={{ color: '#A1A1AA' }}>
                radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <Type className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <h2 className="text-2xl" style={{ color: '#F1F1F1' }}>Typography</h2>
          </div>

          <div
            className="p-8 rounded-2xl space-y-6"
            style={{
              background: 'rgba(17, 17, 17, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.1)',
            }}
          >
            <div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Heading 1</div>
              <h1 style={{ color: '#F1F1F1' }}>The quick brown fox jumps over the lazy dog</h1>
            </div>

            <div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Heading 2</div>
              <h2 style={{ color: '#F1F1F1' }}>The quick brown fox jumps over the lazy dog</h2>
            </div>

            <div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Heading 3</div>
              <h3 style={{ color: '#F1F1F1' }}>The quick brown fox jumps over the lazy dog</h3>
            </div>

            <div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Body Text</div>
              <p style={{ color: '#F1F1F1' }}>
                The quick brown fox jumps over the lazy dog. This is a sample paragraph showing the body text style
                used throughout the SHAH Wallet application.
              </p>
            </div>

            <div>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Small Text</div>
              <p className="text-sm" style={{ color: '#A1A1AA' }}>
                The quick brown fox jumps over the lazy dog. This is smaller supporting text.
              </p>
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Font Family</div>
              <p style={{ color: '#F1F1F1' }}>Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Zap className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl" style={{ color: '#F1F1F1' }}>Buttons</h2>
          </div>

          <div
            className="p-8 rounded-2xl"
            style={{
              background: 'rgba(17, 17, 17, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.1)',
            }}
          >
            <div className="space-y-6">
              <div>
                <div className="text-sm mb-3" style={{ color: '#A1A1AA' }}>Primary (Gold Gradient)</div>
                <div className="flex gap-3">
                  <Button className="px-6" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                    Primary Button
                  </Button>
                  <Button className="px-6" size="sm" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                    Small
                  </Button>
                  <Button className="px-6" size="lg" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                    Large
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-sm mb-3" style={{ color: '#A1A1AA' }}>Outline</div>
                <div className="flex gap-3">
                  <Button variant="outline" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                    Outline Button
                  </Button>
                  <Button variant="outline" size="sm" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                    Small
                  </Button>
                  <Button variant="outline" size="lg" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                    Large
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-sm mb-3" style={{ color: '#A1A1AA' }}>Ghost</div>
                <div className="flex gap-3">
                  <Button style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    Ghost Button
                  </Button>
                  <Button size="sm" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    Small
                  </Button>
                  <Button size="lg" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    Large
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards & Components */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <Square className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <h2 className="text-2xl" style={{ color: '#F1F1F1' }}>Cards & Components</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Standard Card */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
              }}
            >
              <div className="text-sm mb-3" style={{ color: '#A1A1AA' }}>Standard Card</div>
              <h3 className="mb-2" style={{ color: '#F1F1F1' }}>Card Title</h3>
              <p className="text-sm" style={{ color: '#A1A1AA' }}>
                This is a standard glassmorphic card with subtle blur and gold border.
              </p>
              <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
                <code style={{ color: '#D4AF37' }}>
                  background: rgba(17, 17, 17, 0.6);
                  <br />
                  backdrop-filter: blur(20px);
                  <br />
                  border: 1px solid rgba(212, 175, 55, 0.1);
                </code>
              </div>
            </div>

            {/* Featured Card */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)',
              }}
            >
              <div className="text-sm mb-3" style={{ color: '#A1A1AA' }}>Featured Card (with glow)</div>
              <h3 className="mb-2" style={{ color: '#D4AF37' }}>Featured Card Title</h3>
              <p className="text-sm" style={{ color: '#A1A1AA' }}>
                Featured card with gold border and glow effect for emphasis.
              </p>
              <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(10, 10, 10, 0.5)' }}>
                <code style={{ color: '#D4AF37' }}>
                  border: 2px solid rgba(212, 175, 55, 0.3);
                  <br />
                  box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
                </code>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-6 p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="text-sm mb-4" style={{ color: '#A1A1AA' }}>Badges</div>
            <div className="flex flex-wrap gap-3">
              <Badge style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                Gold Badge
              </Badge>
              <Badge style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                Blue Badge
              </Badge>
              <Badge style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Success Badge
              </Badge>
              <Badge style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                Error Badge
              </Badge>
            </div>
          </div>

          {/* Input Fields */}
          <div className="mt-6 p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="text-sm mb-4" style={{ color: '#A1A1AA' }}>Input Fields</div>
            <div className="space-y-3">
              <Input
                placeholder="Standard input"
                style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
              />
              <Input
                placeholder="Focused input"
                className="focus:border-[#D4AF37]"
                style={{ background: '#0A0A0A', border: '1px solid rgba(212, 175, 55, 0.2)', color: '#F1F1F1' }}
              />
            </div>
          </div>
        </section>

        {/* Icons */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Circle className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl" style={{ color: '#F1F1F1' }}>Icons</h2>
          </div>

          <div className="p-8 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="text-sm mb-4" style={{ color: '#A1A1AA' }}>Using Lucide React icons throughout the application</div>
            <div className="flex gap-6">
              {[Palette, Type, Square, Circle, Zap].map((Icon, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                    <Icon className="w-6 h-6" style={{ color: '#D4AF37' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
