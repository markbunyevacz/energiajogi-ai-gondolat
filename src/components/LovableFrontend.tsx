import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function LovableFrontend() {
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
                <Input id="document" type="file" accept=".pdf,.doc,.docx" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="analysis">Elemzés típusa</Label>
                <select id="analysis" className="w-full p-2 border rounded">
                  <option value="contract">Szerződés elemzése</option>
                  <option value="legal">Jogi vélemény</option>
                  <option value="summary">Összefoglaló</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Megjegyzések</Label>
                <Textarea id="notes" placeholder="További megjegyzések vagy követelmények..." />
              </div>
              
              <Button className="w-full">Elemzés indítása</Button>
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
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Kockázati értékelés</h3>
                <p className="text-sm text-gray-600">
                  A dokumentum áttekintése alapján a kockázati szint: Közepes
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Javaslatok</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  <li>Javasolt a szerződési feltételek pontosítása</li>
                  <li>Figyelmet érdemel a felelősség korlátozása</li>
                  <li>Ajánlott a határidők pontosabb meghatározása</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 