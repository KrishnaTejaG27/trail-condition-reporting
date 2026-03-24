import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, User, Clock, ThumbsUp, MessageSquare, Share } from 'lucide-react';

const ReportDetail = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <h1 className="text-3xl font-bold">Report Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Fallen Tree
                  <Badge variant="destructive">High Priority</Badge>
                </CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  2 hours ago
                </div>
              </div>
              <CardDescription>
                Reported by @johndoe on Trail A
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    Large oak tree fell across the trail after yesterday's storm. 
                    Tree is about 2 feet in diameter and completely blocks the path. 
                    Difficult to bypass due to steep slope.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Location</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    Trail A, 0.5 miles from north entrance
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Photos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-square bg-muted rounded-lg"></div>
                    <div className="aspect-square bg-muted rounded-lg"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Confirm (3)
                </Button>
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </Button>
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments (2)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm">
                    S
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">@sarahh</span>
                      <span className="text-sm text-muted-foreground">1 hour ago</span>
                    </div>
                    <p className="text-sm">
                      Just came through here, definitely need to avoid this section. 
                      Trail maintenance notified.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reporter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                  J
                </div>
                <div>
                  <p className="font-medium">@johndoe</p>
                  <p className="text-sm text-muted-foreground">John Doe</p>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    250 reputation points
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Verification</span>
                  <Badge>Verified (3)</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolution</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Severity</span>
                  <Badge variant="destructive">High</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
