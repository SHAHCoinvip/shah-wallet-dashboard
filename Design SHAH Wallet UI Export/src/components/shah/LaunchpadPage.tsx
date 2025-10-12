import { Rocket, Clock, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const nftCollections = [
  {
    name: 'Royal Shah NFTs',
    image: 'https://images.unsplash.com/photo-1635237755468-5fba69c13f29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZnQlMjBkaWdpdGFsJTIwYXJ0fGVufDF8fHx8MTc2MDE2MjA2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    supply: '10,000',
    minted: '7,542',
    price: '250 SHAH',
    status: 'live',
    featured: true,
  },
  {
    name: 'SHAH Gold Pass',
    image: 'https://images.unsplash.com/photo-1594896733292-9a77b5809c63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdvbGQlMjBsdXh1cnl8ZW58MXx8fHwxNzYwMjQ5NTA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    supply: '5,000',
    minted: '4,999',
    price: '500 SHAH',
    status: 'live',
    featured: true,
  },
  {
    name: 'Crypto Legends',
    image: 'https://images.unsplash.com/photo-1590286162167-70fb467846ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcnlwdG9jdXJyZW5jeSUyMGJsb2NrY2hhaW58ZW58MXx8fHwxNzYwMTU4MjI5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    supply: '8,000',
    minted: '2,145',
    price: '180 SHAH',
    status: 'live',
    featured: false,
  },
  {
    name: 'Diamond Elite',
    image: 'https://images.unsplash.com/photo-1635237755468-5fba69c13f29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZnQlMjBkaWdpdGFsJTIwYXJ0fGVufDF8fHx8MTc2MDE2MjA2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    supply: '3,000',
    minted: '0',
    price: '750 SHAH',
    status: 'upcoming',
    featured: false,
  },
];

export function LaunchpadPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>NFT Launchpad</h1>
        <p style={{ color: '#A1A1AA' }}>Discover and mint exclusive NFT collections</p>
      </div>

      {/* Featured Hero */}
      <div className="mb-8 p-8 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)' }} />
        
        <div className="grid grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col justify-center">
            <Badge className="w-fit mb-4" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              Featured Collection
            </Badge>
            
            <h2 className="text-4xl mb-4" style={{ color: '#D4AF37' }}>Royal Shah NFTs</h2>
            
            <p className="mb-6" style={{ color: '#A1A1AA' }}>
              Join the royal family with exclusive NFTs that grant you +25% staking rewards, early access to new features, and governance rights in the SHAH ecosystem.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Total Supply</div>
                <div className="text-xl" style={{ color: '#F1F1F1' }}>10,000</div>
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Minted</div>
                <div className="text-xl" style={{ color: '#F1F1F1' }}>7,542</div>
              </div>
              <div>
                <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Price</div>
                <div className="text-xl" style={{ color: '#D4AF37' }}>250 SHAH</div>
              </div>
            </div>
            
            <Button className="w-fit px-8 h-12" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
              Mint Now
            </Button>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="w-80 h-80 rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)' }}>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1635237755468-5fba69c13f29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZnQlMjBkaWdpdGFsJTIwYXJ0fGVufDF8fHx8MTc2MDE2MjA2OXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Featured NFT"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="live" className="w-full">
        <TabsList className="mb-6" style={{ background: '#111111', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <TabsTrigger value="live" style={{ color: '#A1A1AA' }}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Live
          </TabsTrigger>
          <TabsTrigger value="upcoming" style={{ color: '#A1A1AA' }}>
            <Clock className="w-4 h-4 mr-2" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="archived" style={{ color: '#A1A1AA' }}>
            <Rocket className="w-4 h-4 mr-2" />
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <div className="grid grid-cols-3 gap-6">
            {nftCollections
              .filter((c) => c.status === 'live')
              .map((collection, index) => (
                <div
                  key={index}
                  className="rounded-2xl overflow-hidden transition-all hover:scale-105"
                  style={{
                    background: 'rgba(17, 17, 17, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                  }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                    {collection.featured && (
                      <div className="absolute top-4 right-4">
                        <Badge style={{ background: 'rgba(212, 175, 55, 0.9)', color: '#0A0A0A' }}>
                          Featured
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge style={{ background: 'rgba(16, 185, 129, 0.9)', color: 'white' }}>
                        Live
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg mb-3" style={{ color: '#F1F1F1' }}>{collection.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Supply</div>
                        <div className="text-sm" style={{ color: '#F1F1F1' }}>{collection.supply}</div>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Minted</div>
                        <div className="text-sm" style={{ color: '#10B981' }}>{collection.minted}</div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs" style={{ color: '#A1A1AA' }}>Progress</span>
                        <span className="text-xs" style={{ color: '#F1F1F1' }}>
                          {((parseInt(collection.minted.replace(',', '')) / parseInt(collection.supply.replace(',', ''))) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(parseInt(collection.minted.replace(',', '')) / parseInt(collection.supply.replace(',', ''))) * 100}%`,
                            background: 'linear-gradient(90deg, #D4AF37 0%, #F4D03F 100%)',
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Price</div>
                        <div className="text-lg" style={{ color: '#D4AF37' }}>{collection.price}</div>
                      </div>
                      <Button style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                        Mint
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-3 gap-6">
            {nftCollections
              .filter((c) => c.status === 'upcoming')
              .map((collection, index) => (
                <div
                  key={index}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(17, 17, 17, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(212, 175, 55, 0.1)',
                  }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge style={{ background: 'rgba(59, 130, 246, 0.9)', color: 'white' }}>
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="text-lg mb-3" style={{ color: '#F1F1F1' }}>{collection.name}</h3>
                    
                    <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <div className="text-xs mb-1" style={{ color: '#3B82F6' }}>Launches in</div>
                      <div className="text-lg" style={{ color: '#F1F1F1' }}>48 hours</div>
                    </div>
                    
                    <Button className="w-full" variant="outline" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                      Notify Me
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="archived">
          <div className="text-center py-12" style={{ color: '#A1A1AA' }}>
            <Rocket className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No archived collections yet</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Partner Logos */}
      <div className="mt-12 p-8 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
        <h3 className="text-center mb-6" style={{ color: '#A1A1AA' }}>Trusted Partners</h3>
        <div className="flex items-center justify-center gap-12">
          {['OpenSea', 'Rarible', 'SuperRare', 'Foundation', 'Nifty'].map((partner, index) => (
            <div key={index} className="text-xl opacity-50 hover:opacity-100 transition-opacity" style={{ color: '#F1F1F1' }}>
              {partner}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
