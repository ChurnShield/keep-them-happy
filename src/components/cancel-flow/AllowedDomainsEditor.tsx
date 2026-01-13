import { useState } from 'react';
import { X, Plus, Globe, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface AllowedDomainsEditorProps {
  allowedDomains: string[];
  onUpdate: (domains: string[]) => void;
}

// Domain validation regex - matches domain without protocol
const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

export function AllowedDomainsEditor({ allowedDomains, onUpdate }: AllowedDomainsEditorProps) {
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cleanDomain = (input: string): string => {
    // Remove protocol if present
    let domain = input.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, '');
    // Remove trailing slash
    domain = domain.replace(/\/$/, '');
    // Remove path
    domain = domain.split('/')[0];
    return domain;
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain) {
      setError('Please enter a domain');
      return false;
    }

    const cleaned = cleanDomain(domain);

    if (!DOMAIN_REGEX.test(cleaned)) {
      setError('Invalid domain format. Example: example.com');
      return false;
    }

    if (allowedDomains.includes(cleaned)) {
      setError('This domain is already added');
      return false;
    }

    setError(null);
    return true;
  };

  const handleAddDomain = () => {
    const cleaned = cleanDomain(newDomain);
    
    if (!validateDomain(newDomain)) {
      return;
    }

    onUpdate([...allowedDomains, cleaned]);
    setNewDomain('');
    toast.success(`Domain ${cleaned} added`);
  };

  const handleRemoveDomain = (domain: string) => {
    onUpdate(allowedDomains.filter((d) => d !== domain));
    toast.success(`Domain ${domain} removed`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDomain();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Allowed Domains
        </CardTitle>
        <CardDescription>
          Restrict where your widget can be embedded for security
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Domain Input */}
        <div className="flex gap-2">
          <Input
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => {
              setNewDomain(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleAddDomain} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Domain
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Domain List */}
        {allowedDomains.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allowedDomains.map((domain) => (
              <Badge
                key={domain}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1.5 text-sm"
              >
                <Globe className="h-3.5 w-3.5" />
                {domain}
                <button
                  onClick={() => handleRemoveDomain(domain)}
                  className="ml-1 hover:text-destructive transition-colors"
                  aria-label={`Remove ${domain}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No domains added. Your widget will work on any website.
              <span className="block mt-1 text-muted-foreground text-xs">
                Add domains to restrict widget usage to specific websites only.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Security Note */}
        {allowedDomains.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Widget requests from unlisted domains will be rejected.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
