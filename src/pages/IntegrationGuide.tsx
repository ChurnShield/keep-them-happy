import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  Globe, 
  TestTube,
  Webhook,
  Key,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { useProfile } from '@/hooks/useProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2 text-muted-foreground hover:text-foreground"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

function CodeBlock({ code, language = 'javascript', label = 'Code' }: { code: string; language?: string; label?: string }) {
  return (
    <div className="relative rounded-lg bg-zinc-950 border border-border">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <CopyButton text={code} label={label} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-zinc-300 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

export default function IntegrationGuide() {
  const { profile } = useProfile();
  const [showToken, setShowToken] = useState(false);

  const appUrl = window.location.origin;
  const widgetToken = profile?.id || 'your-widget-token';
  const maskedToken = widgetToken.slice(0, 8) + '••••••••' + widgetToken.slice(-4);

  // Code examples
  const nodeExample = `const response = await fetch('${appUrl}/api/widget/session', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${widgetToken}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_id: 'cus_123abc',
    email: 'customer@example.com',
    subscription_id: 'sub_456def',
    plan_name: 'Pro Plan',
    amount: 4900 // in cents
  })
});

const { session_token } = await response.json();

// Redirect user to cancel flow
window.location.href = \`${appUrl}/cancel/\${session_token}\`;`;

  const pythonExample = `import requests

response = requests.post(
    '${appUrl}/api/widget/session',
    headers={
        'Authorization': 'Bearer ${widgetToken}',
        'Content-Type': 'application/json'
    },
    json={
        'customer_id': 'cus_123abc',
        'email': 'customer@example.com',
        'subscription_id': 'sub_456def',
        'plan_name': 'Pro Plan',
        'amount': 4900  # in cents
    }
)

data = response.json()
session_token = data['session_token']

# Return redirect URL to frontend
redirect_url = f'${appUrl}/cancel/{session_token}'`;

  const curlExample = `curl -X POST '${appUrl}/api/widget/session' \\
  -H 'Authorization: Bearer ${widgetToken}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "customer_id": "cus_123abc",
    "email": "customer@example.com",
    "subscription_id": "sub_456def",
    "plan_name": "Pro Plan",
    "amount": 4900
  }'`;

  const redirectCode = `// After creating a session on your backend
const sessionToken = 'received-from-backend';

// Redirect to hosted cancel flow
window.location.href = \`${appUrl}/cancel/\${sessionToken}\`;`;

  const embedCode = `<!-- Add to your HTML -->
<script src="${appUrl}/widget.js"></script>

<script>
  ChurnShield.init({
    token: '${widgetToken}',
    onCancel: function(data) {
      console.log('Subscription cancelled:', data);
    },
    onSave: function(data) {
      console.log('Customer saved:', data);
    }
  });
</script>

<!-- Trigger the widget -->
<button onclick="ChurnShield.open({ 
  customerId: 'cus_123', 
  email: 'customer@example.com',
  subscriptionId: 'sub_456',
  planName: 'Pro Plan',
  amount: 4900
})">
  Cancel Subscription
</button>`;

  return (
    <ProtectedLayout
      title="Integration Guide"
      subtitle="Add ChurnShield to your application in minutes"
      showLogo
    >
      <div className="space-y-8">
        {/* Section 1: Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get up and running with ChurnShield in 3 simple steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-foreground">Get your widget token</h3>
                <p className="text-sm text-muted-foreground">
                  Your widget token authenticates API requests. Keep it secure.
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <code className="flex-1 text-sm font-mono text-foreground">
                    {showToken ? widgetToken : maskedToken}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </Button>
                  <CopyButton text={widgetToken} label="Token" />
                </div>
                <Link to="/cancel-flow" className="inline-flex items-center text-sm text-primary hover:underline">
                  Manage in Widget Setup
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-foreground">Create a cancel session (backend)</h3>
                <p className="text-sm text-muted-foreground">
                  When a customer wants to cancel, create a session from your backend.
                </p>
                <CodeBlock 
                  code={`POST ${appUrl}/api/widget/session`}
                  language="endpoint"
                  label="Endpoint"
                />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-foreground">Redirect to cancel flow</h3>
                <p className="text-sm text-muted-foreground">
                  Send the customer to the hosted cancel page using the session token.
                </p>
                <CodeBlock 
                  code={`${appUrl}/cancel/{session_token}`}
                  language="url"
                  label="URL pattern"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Backend Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              Backend Integration
            </CardTitle>
            <CardDescription>
              Create cancel sessions from your server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="node" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="node">Node.js</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="node">
                <CodeBlock code={nodeExample} language="javascript" label="Node.js code" />
              </TabsContent>

              <TabsContent value="python">
                <CodeBlock code={pythonExample} language="python" label="Python code" />
              </TabsContent>

              <TabsContent value="curl">
                <CodeBlock code={curlExample} language="bash" label="cURL command" />
              </TabsContent>
            </Tabs>

            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> The <code className="bg-blue-500/20 px-1 rounded">amount</code> field should be in cents (e.g., 4900 for $49.00).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Frontend Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Frontend Integration
            </CardTitle>
            <CardDescription>
              Choose how to present the cancel flow to your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="redirect" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="redirect" className="gap-2">
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  Redirect
                </TabsTrigger>
                <TabsTrigger value="embed">Embedded Widget</TabsTrigger>
              </TabsList>

              <TabsContent value="redirect" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The simplest approach: redirect customers to the hosted cancel page. 
                  Works with any frontend framework.
                </p>
                <CodeBlock code={redirectCode} language="javascript" label="Redirect code" />
              </TabsContent>

              <TabsContent value="embed" className="space-y-4">
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronDown className="h-4 w-4" />
                    <span>Advanced: Embed widget in your application</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <CodeBlock code={embedCode} language="html" label="Embed code" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      The embedded widget allows you to handle cancel and save events directly in your application.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section 4: Webhook Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              Webhook Events
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Get notified when customers complete the cancel flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <code className="font-mono text-foreground">cancel.completed</code>
                <span>Customer completed cancellation</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <code className="font-mono text-foreground">cancel.saved</code>
                <span>Customer accepted a retention offer</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Webhooks coming in a future update. Stay tuned!
            </p>
          </CardContent>
        </Card>

        {/* Section 5: Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-primary" />
              Testing
            </CardTitle>
            <CardDescription>
              Test your integration before going live
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use test mode to preview your cancel flow without affecting real subscriptions 
              or making actual changes in Stripe.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="default">
                <Link to="/cancel-flow">
                  <TestTube className="h-4 w-4 mr-2" />
                  Open Test Link Generator
                </Link>
              </Button>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                <strong>Reminder:</strong> Always test your cancel flow before deploying to production. 
                Test mode does not affect real subscriptions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integration Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Checklist</CardTitle>
            <CardDescription>
              Make sure you've completed all steps before going live
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded border border-border flex items-center justify-center mt-0.5">
                  <span className="text-xs text-muted-foreground">☐</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Design your cancel flow</p>
                  <Link to="/cancel-flow" className="text-xs text-primary hover:underline">
                    Configure survey options and offers →
                  </Link>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded border border-border flex items-center justify-center mt-0.5">
                  <span className="text-xs text-muted-foreground">☐</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Implement backend session creation</p>
                  <p className="text-xs text-muted-foreground">Add API call to create cancel sessions</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded border border-border flex items-center justify-center mt-0.5">
                  <span className="text-xs text-muted-foreground">☐</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Add cancel button to your app</p>
                  <p className="text-xs text-muted-foreground">Redirect users to the cancel flow</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded border border-border flex items-center justify-center mt-0.5">
                  <span className="text-xs text-muted-foreground">☐</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Test your cancel flow</p>
                  <Link to="/cancel-flow" className="text-xs text-primary hover:underline">
                    Generate and test your cancel flow →
                  </Link>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
