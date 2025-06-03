import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function LovableFrontend() {
  const [file, setFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState('contract');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalysisTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnalysisType(e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (!file) {
        setError('Kérlek, válassz ki egy fájlt!');
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysisType', analysisType);
      formData.append('notes', notes);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('A szerver hibát jelzett.');
      }
      const data = await response.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Hiba történt az elemzés során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Jogi AI Demo</CardTitle>
            <CardDescription>
              A jogi dokumentumok elemzésére és feldolgozására szolgáló AI-alapú megoldás
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="document">Dokumentum feltöltése</Label>
                <Input id="document" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                {file && <span className="text-xs text-muted-foreground">Kiválasztva: {file.name}</span>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analysis">Elemzés típusa</Label>
                <select id="analysis" className="w-full p-2 border rounded" value={analysisType} onChange={handleAnalysisTypeChange}>
                  <option value="contract">Szerződés elemzése</option>
                  <option value="legal">Jogi vélemény</option>
                  <option value="summary">Összefoglaló</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Megjegyzések</Label>
                <Textarea id="notes" placeholder="További megjegyzések vagy követelmények..." value={notes} onChange={handleNotesChange} />
              </div>
              <Button className="w-full" onClick={handleAnalyze} disabled={loading || !file}>
                {loading ? 'Elemzés folyamatban...' : 'Elemzés indítása'}
              </Button>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eredmények</CardTitle>
            <CardDescription>
              Az AI által generált elemzés és javaslatok
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-2">Kockázati értékelés</h3>
                  <p className="text-sm text-gray-600">
                    A dokumentum áttekintése alapján a kockázati szint: <b>{result.risk}</b>
                  </p>
                  {result.fileName && (
                    <p className="text-xs text-muted-foreground mt-1">Fájl: {result.fileName}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Típus: {result.analysisType}</p>
                  {result.notes && <p className="text-xs text-muted-foreground mt-1">Megjegyzés: {result.notes}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-2">Javaslatok</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {result.suggestions.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Nincs még eredmény.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 