'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key, Eye, EyeOff, Check, Trash2, LoaderCircle,
  Star, Plus, ExternalLink, ShieldCheck, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getProviderDisplayName, getProviderIcon, PROVIDER_DOCS } from '@/lib/provider-types';

interface SavedKey {
  _id: string;
  provider: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
  keyHint: string;
}



function validateKeyInput(provider: string, key: string): string | null {
  if (!key.trim()) return 'API key is required';
  switch (provider) {
    case 'gemini':
      if (!key.startsWith('AIza')) return 'Gemini keys usually start with "AIza"';
      break;
    case 'openai':
      if (!key.startsWith('sk-')) return 'OpenAI keys usually start with "sk-"';
      break;
    case 'claude':
      if (!key.startsWith('sk-ant-')) return 'Claude keys usually start with "sk-ant-"';
      break;
  }
  return null;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<SavedKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingProvider, setAddingProvider] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState<string>('');

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setKeys(data.keys || []);
      const def = data.keys?.find((k: any) => k.isDefault);
      if (def) setDefaultProvider(def.provider);
      else if (data.keys?.length > 0) setDefaultProvider(data.keys[0].provider);
    } catch {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (provider: string) => {
    const validationError = validateKeyInput(provider, newKey);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: newKey.trim(),
          makeDefault: keys.length === 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved and validated`);
      setNewKey('');
      setAddingProvider(null);
      setShowKey(false);
      await fetchKeys();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save key');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Key removed');
      await fetchKeys();
    } catch {
      toast.error('Failed to delete key');
    }
  };

  const handleSetDefault = async (key: SavedKey) => {
    try {
      const res = await fetch('/api/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: key._id, makeDefault: true }),
      });
      if (!res.ok) throw new Error('Failed to set default');
      toast.success(`${getProviderDisplayName(key.provider as any)} set as default`);
      await fetchKeys();
    } catch {
      toast.error('Failed to update default');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const providers = ['gemini', 'openai', 'claude'];
  const activeProvider = addingProvider;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-1">Settings</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure your AI providers. Add your own API keys to use different AI models.
        </p>
      </div>

      {/* Default provider indicator */}
      {defaultProvider && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Default AI Provider</p>
              <p className="text-xs text-muted-foreground">
                {getProviderDisplayName(defaultProvider as any)}
                {' — used for all features by default'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Provider Keys */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">API Keys</h3>

        {providers.map((provider) => {
          const savedKey = keys.find((k) => k.provider === provider);
          const isAdding = addingProvider === provider;
          const isDefault = savedKey?.isDefault;

          return (
            <motion.div
              key={provider}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border ${isDefault ? 'border-primary/30' : 'border-border'}`}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="text-xl mt-0.5">{getProviderIcon(provider as any)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">{getProviderDisplayName(provider as any)}</h4>
                          {isDefault && (
                            <Badge variant="default" className="text-[10px] h-5 px-1.5">
                              <Star className="h-2.5 w-2.5 mr-0.5" /> Default
                            </Badge>
                          )}
                          {savedKey && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-emerald-500 border-emerald-500/30">
                              <Check className="h-2.5 w-2.5 mr-0.5" /> Configured
                            </Badge>
                          )}
                        </div>
                        {savedKey ? (
                          <p className="text-xs text-muted-foreground mt-1">{savedKey.label}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">No key configured</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {savedKey && !isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleSetDefault(savedKey)}
                        >
                          <Star className="h-3 w-3 mr-1" /> Set Default
                        </Button>
                      )}
                      {savedKey && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteKey(savedKey._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {!savedKey && !isAdding && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => { setAddingProvider(provider); setNewKey(''); setShowKey(false); }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Key
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Add key form */}
                  {isAdding && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-4 border-t border-border space-y-3"
                    >
                      <div className="flex items-start gap-2 text-xs text-muted-foreground mb-1">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <p>
                          Your key is encrypted and stored securely. It&apos;s only used to make AI requests from this app.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <ExternalLink className="h-3 w-3" />
                        <a
                          href={PROVIDER_DOCS[provider as keyof typeof PROVIDER_DOCS]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Get your {provider === 'gemini' ? 'Gemini' : provider === 'openai' ? 'OpenAI' : 'Claude'} API key
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={newKey}
                            onChange={e => setNewKey(e.target.value)}
                            type={showKey ? 'text' : 'password'}
                            placeholder={`Paste your ${provider} API key...`}
                            className="pr-10 font-mono text-xs"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleAddKey(provider)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddKey(provider)}
                          disabled={!newKey.trim() || saving}
                          className="flex-shrink-0"
                        >
                          {saving ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save & Validate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setAddingProvider(null); setNewKey(''); }}
                          className="flex-shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>• API keys are encrypted before being stored in the database.</p>
          <p>• Keys are only used to make requests to the AI provider you choose.</p>
          <p>• Set a default provider — all features will use that model automatically.</p>
          <p>• You can add keys for all providers and switch between them.</p>
          <p>• Your keys are never exposed to other users or shared anywhere.</p>
        </CardContent>
      </Card>
    </div>
  );
}
