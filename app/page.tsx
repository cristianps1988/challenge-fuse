import Link from 'next/link';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { FileUp, FileText, BarChart3, Settings } from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Upload Documents',
      description: 'Drag and drop PDF files for automatic classification and extraction',
      icon: FileUp,
      href: '/upload',
    },
    {
      title: 'View Documents',
      description: 'Review processed documents, extracted data, and confidence scores',
      icon: FileText,
      href: '/documents',
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track classification accuracy, extraction metrics, and system performance',
      icon: BarChart3,
      href: '/dashboard',
    },
    {
      title: 'Settings',
      description: 'Configure confidence thresholds and system parameters',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI-Powered Document Processing
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Automatically classify and extract structured data from loan origination documents using GPT-4o
        </p>
        <div className="mt-8">
          <Link href="/upload">
            <Button size="lg">
              <FileUp className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full transition-shadow hover:shadow-lg cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
