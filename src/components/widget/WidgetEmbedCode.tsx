import { useState } from 'react';
import { Copy, Check, Code2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface WidgetEmbedCodeProps {
  profileId: string;
  appUrl?: string;
}

export function WidgetEmbedCode({ profileId, appUrl }: WidgetEmbedCodeProps) {
  const [copied, setCopied] = useState<string | null>(null);
  
  const baseUrl = appUrl || window.location.origin;
  
  const scriptTag = `<script src="${baseUrl}/widget.js"></script>`;
  
  const initCode = `<script>
  // Initialize ChurnShield with your token and customer data
  ChurnShield.init({
    token: '${profileId}',
    customerId: 'CUSTOMER_STRIPE_ID',      // Replace with customer's Stripe ID
    subscriptionId: 'SUBSCRIPTION_STRIPE_ID', // Replace with subscription's Stripe ID
    onSave: function() {
      // Called when customer accepts an offer and stays
      console.log('Customer saved!');
    },
    onCancel: function() {
      // Called when customer completes cancellation
      console.log('Customer cancelled');
    },
    onClose: function() {
      // Called when widget is closed (by any means)
      console.log('Widget closed');
    }
  });
</script>`;

  const triggerCode = `<!-- Add this to your cancel button -->
<button onclick="ChurnShield.open()">
  Cancel Subscription
</button>`;

  const fullExample = `<!DOCTYPE html>
<html>
<head>
  <title>Cancel Subscription</title>
  ${scriptTag}
</head>
<body>
  <button id="cancel-btn">Cancel My Subscription</button>

  ${initCode}
  
  <script>
    document.getElementById('cancel-btn').addEventListener('click', function() {
      ChurnShield.open();
    });
  </script>
</body>
</html>`;

  const reactExample = `import { useEffect } from 'react';

// Load the ChurnShield widget script
const loadChurnShield = () => {
  return new Promise((resolve, reject) => {
    if (window.ChurnShield) {
      resolve(window.ChurnShield);
      return;
    }
    
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.onload = () => resolve(window.ChurnShield);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export function CancelButton({ customerId, subscriptionId }) {
  useEffect(() => {
    loadChurnShield().then((ChurnShield) => {
      ChurnShield.init({
        token: '${profileId}',
        customerId,
        subscriptionId,
        onSave: () => {
          // Handle save - maybe refetch subscription data
          console.log('Customer saved!');
        },
        onCancel: () => {
          // Handle cancellation - maybe redirect
          console.log('Subscription cancelled');
        },
      });
    });
  }, [customerId, subscriptionId]);

  const handleCancel = () => {
    if (window.ChurnShield) {
      window.ChurnShield.open();
    }
  };

  return (
    <button onClick={handleCancel}>
      Cancel Subscription
    </button>
  );
}`;

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  function CopyButton({ text, label }: { text: string; label: string }) {
    const isCopied = copied === label;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(text, label)}
        className="absolute top-2 right-2"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="h-5 w-5" />
          Embed Widget Code
        </CardTitle>
        <CardDescription>
          Add the ChurnShield cancel flow widget to your website or application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Setup</TabsTrigger>
            <TabsTrigger value="full">Full Example</TabsTrigger>
            <TabsTrigger value="react">React</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-medium mb-2">1. Add the script tag to your page</h4>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                  <code>{scriptTag}</code>
                </pre>
                <CopyButton text={scriptTag} label="Script tag" />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">2. Initialize the widget</h4>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                  <code>{initCode}</code>
                </pre>
                <CopyButton text={initCode} label="Init code" />
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">3. Trigger the widget</h4>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                  <code>{triggerCode}</code>
                </pre>
                <CopyButton text={triggerCode} label="Trigger code" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="full" className="mt-4">
            <div className="relative">
              <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto max-h-[400px]">
                <code>{fullExample}</code>
              </pre>
              <CopyButton text={fullExample} label="Full example" />
            </div>
          </TabsContent>
          
          <TabsContent value="react" className="mt-4">
            <div className="relative">
              <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto max-h-[400px]">
                <code>{reactExample}</code>
              </pre>
              <CopyButton text={reactExample} label="React example" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This React component handles loading the script and initializing ChurnShield.
              Use it in your settings or subscription management pages.
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <ExternalLink className="h-4 w-4" />
            Important Notes
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Replace <code className="text-primary">CUSTOMER_STRIPE_ID</code> with the customer's actual Stripe ID</li>
            <li>Replace <code className="text-primary">SUBSCRIPTION_STRIPE_ID</code> with the subscription's Stripe ID</li>
            <li>The widget will automatically use your configured branding and offers</li>
            <li>Test the integration using the "Generate Test Link" button first</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
