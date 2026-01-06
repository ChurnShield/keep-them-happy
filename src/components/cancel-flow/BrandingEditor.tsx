import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Palette, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Branding } from '@/hooks/useCancelFlowConfig';

interface BrandingEditorProps {
  branding: Branding;
  onUpdate: (branding: Branding) => void;
}

export function BrandingEditor({ branding, onUpdate }: BrandingEditorProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...branding, primary_color: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 2MB.');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, JPG, or SVG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate({ ...branding, logo_url: e.target?.result as string });
      toast.success('Logo uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeLogo = () => {
    onUpdate({ ...branding, logo_url: null });
  };

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Branding
        </CardTitle>
        <CardDescription>
          Customize the look and feel of your cancel flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Picker */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Primary Accent Color</Label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="color"
                value={branding.primary_color}
                onChange={handleColorChange}
                className="w-12 h-12 rounded-lg cursor-pointer border border-border/50"
              />
            </div>
            <Input
              value={branding.primary_color}
              onChange={(e) => {
                const value = e.target.value;
                // Allow typing but only save valid hex colors
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                  onUpdate({ ...branding, primary_color: value || '#14B8A6' });
                }
              }}
              className="w-28 bg-background/50 font-mono text-sm"
              placeholder="#14B8A6"
            />
            <div 
              className="h-12 flex-1 rounded-lg border border-border/50"
              style={{ backgroundColor: branding.primary_color }}
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Logo</Label>
          {branding.logo_url ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-muted/30">
              <img 
                src={branding.logo_url} 
                alt="Logo preview" 
                className="h-12 w-auto object-contain"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={removeLogo}
                className="text-destructive hover:text-destructive ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed transition-colors ${
                dragOver ? 'border-primary bg-primary/10' : 'border-border/50 bg-muted/30'
              }`}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Drag & drop your logo here, or{' '}
                <label className="text-primary cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, or SVG (max 2MB)
              </p>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
          <div>
            <Label className="text-sm">Dark Mode</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use dark theme for the cancel widget
            </p>
          </div>
          <Switch
            checked={branding.dark_mode}
            onCheckedChange={(checked) => onUpdate({ ...branding, dark_mode: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
