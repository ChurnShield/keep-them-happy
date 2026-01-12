import { useState } from 'react';
import { Link2, Copy, ExternalLink, Loader2, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

interface TestLinkGeneratorProps {
  profileId: string | null;
}

interface TestData {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthlyAmount: number;
}

export function TestLinkGenerator({ profileId }: TestLinkGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  
  const [testData, setTestData] = useState<TestData>({
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    planName: 'Pro Plan',
    monthlyAmount: 49,
  });

  const generateTestLink = async () => {
    if (!profileId) {
      toast.error('Profile not loaded. Please try again.');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('widget-api', {
        body: { 
          profile_id: profileId,
          test_data: testData,
        },
        method: 'POST',
        headers: {
          'x-test-session': 'true',
        },
      });

      if (error) throw error;

      if (data?.session_token) {
        // Build URL with test params
        const baseUrl = `${window.location.origin}/cancel/${data.session_token}`;
        const params = new URLSearchParams({
          test: 'true',
          name: testData.customerName,
          email: testData.customerEmail,
          plan: testData.planName,
          amount: testData.monthlyAmount.toString(),
        });
        const url = `${baseUrl}?${params.toString()}`;
        setTestUrl(url);
        setIsOpen(true);
      } else if (data?.test_url) {
        // Fallback (older responses)
        const params = new URLSearchParams({
          test: 'true',
          name: testData.customerName,
          email: testData.customerEmail,
          plan: testData.planName,
          amount: testData.monthlyAmount.toString(),
        });
        setTestUrl(`${data.test_url}?${params.toString()}`);
        setIsOpen(true);
      } else {
        throw new Error('No test URL returned');
      }
    } catch (error) {
      console.error('Failed to generate test link:', error);
      toast.error('Failed to generate test link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!testUrl) return;
    
    try {
      await navigator.clipboard.writeText(testUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const openInNewTab = () => {
    if (testUrl) {
      window.open(testUrl, '_blank');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTestUrl(null);
    setCopied(false);
    setShowQrCode(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            Generate Test Link
          </CardTitle>
          <CardDescription>
            Preview your cancel flow without affecting real subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={testData.customerName}
                onChange={(e) => setTestData({ ...testData, customerName: e.target.value })}
                placeholder="Test Customer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={testData.customerEmail}
                onChange={(e) => setTestData({ ...testData, customerEmail: e.target.value })}
                placeholder="test@example.com"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                id="planName"
                value={testData.planName}
                onChange={(e) => setTestData({ ...testData, planName: e.target.value })}
                placeholder="Pro Plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">Monthly Amount ($)</Label>
              <Input
                id="monthlyAmount"
                type="number"
                min={0}
                value={testData.monthlyAmount}
                onChange={(e) => setTestData({ ...testData, monthlyAmount: Number(e.target.value) })}
                placeholder="49"
              />
            </div>
          </div>

          <Button
            onClick={generateTestLink}
            disabled={isGenerating || !profileId}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Generate Test Link
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Cancel Flow Link</DialogTitle>
            <DialogDescription>
              Use this link to preview your cancel flow widget with test data. No real subscription will be affected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Test Mode Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-600 dark:text-amber-400 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                TEST MODE - No real changes will be made
              </p>
            </div>

            {/* URL Field */}
            <div className="flex gap-2">
              <Input
                value={testUrl || ''}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQrCode(!showQrCode)}
                className="shrink-0"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>

            {/* QR Code */}
            {showQrCode && testUrl && (
              <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={testUrl} 
                  size={200}
                  level="M"
                  includeMargin
                />
                <p className="text-xs text-muted-foreground text-center">
                  Scan with your phone to test on mobile
                </p>
              </div>
            )}

            {/* Test Data Summary */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">Test Customer Details:</p>
              <div className="grid grid-cols-2 gap-x-4 text-sm text-muted-foreground">
                <span>Name: {testData.customerName}</span>
                <span>Email: {testData.customerEmail}</span>
                <span>Plan: {testData.planName}</span>
                <span>Amount: ${testData.monthlyAmount}/mo</span>
              </div>
            </div>

            {/* Expiry Notice */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="text-amber-500">⏱</span>
                This link expires in 30 minutes
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact button version for use in toolbars
export function TestLinkButton({ profileId }: TestLinkGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateTestLink = async () => {
    if (!profileId) {
      toast.error('Profile not loaded. Please try again.');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('widget-api', {
        body: { profile_id: profileId },
        method: 'POST',
        headers: {
          'x-test-session': 'true',
        },
      });

      if (error) throw error;

      if (data?.session_token) {
        const url = `${window.location.origin}/cancel/${data.session_token}?test=true`;
        setTestUrl(url);
        setIsOpen(true);
      } else if (data?.test_url) {
        setTestUrl(`${data.test_url}?test=true`);
        setIsOpen(true);
      } else {
        throw new Error('No test URL returned');
      }
    } catch (error) {
      console.error('Failed to generate test link:', error);
      toast.error('Failed to generate test link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!testUrl) return;
    try {
      await navigator.clipboard.writeText(testUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const openInNewTab = () => {
    if (testUrl) {
      window.open(testUrl, '_blank');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTestUrl(null);
    setCopied(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={generateTestLink}
        disabled={isGenerating || !profileId}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Link2 className="h-4 w-4 mr-2" />
        )}
        Generate Test Link
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Test Cancel Flow Link</DialogTitle>
            <DialogDescription>
              Use this link to preview your cancel flow widget with test data. No real subscription will be affected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                value={testUrl || ''}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={openInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="text-amber-500">⏱</span>
                This link expires in 30 minutes
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
