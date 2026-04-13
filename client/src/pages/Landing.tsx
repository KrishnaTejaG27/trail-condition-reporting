import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Shield, Users, AlertTriangle } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Trail Safety</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              🏔️ Real-time Trail Conditions & Safety Reports
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Stay safe on the trails with community-powered hazard reporting, 
              live condition maps, and instant safety alerts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link to="/app">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  View Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Trail Safety Platform?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Live Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time hazard reporting from the community keeps you informed 
                  about current trail conditions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Community Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Reports are confirmed by other users, ensuring accurate and 
                  reliable trail information.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Safety Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get instant notifications about critical hazards and trail 
                  closures in your area.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Interactive Maps</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Easy-to-use maps showing all reported conditions with 
                  filtering and search capabilities.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to explore safely?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of hikers, runners, and outdoor enthusiasts 
            who are making trails safer for everyone.
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Trail Safety Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
