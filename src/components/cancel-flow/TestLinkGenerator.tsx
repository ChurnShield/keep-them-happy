import { useState } from 'react';
import { Link2, Copy, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TestLinkGeneratorProps {
  profileId: string | null;
}

export function TestLinkGenerator({ profileId }: TestLinkGeneratorProps) {
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

      if (data?.test_url) {
        setTestUrl(data.test_url);
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
