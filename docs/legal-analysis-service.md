# Jogi Elemzési Szolgáltatás Dokumentáció

## Áttekintés

A `LegalAnalysisService` osztály felelős a jogi dokumentumok (szerződések, irányelvek, szabályozások) automatikus elemzéséért. A szolgáltatás AI-alapú elemzést végez, kockázatokat azonosít és javaslatokat tesz a dokumentumok javítására.

## Főbb funkciók

### 1. Dokumentum Feldolgozás
- PDF fájlok feldolgozása
- Szöveg kinyerése
- Dokumentum chunk-okra bontása
- Párhuzamos elemzés

### 2. Elemzés
- Kockázatok azonosítása
- Javítási javaslatok generálása
- Megbízhatósági pontszám számítása
- Kockázati szint meghatározása

### 3. Adattárolás
- Dokumentumok tárolása
- Elemzési eredmények mentése
- Kockázatok rögzítése
- Teljesítmény metrikák gyűjtése

### 4. Hibakezelés
- Részletes hibaüzenetek
- Tranzakció kezelés
- Validáció
- Naplózás

## Használat

```typescript
const legalAnalysisService = new LegalAnalysisService();

// Dokumentum elemzése
const result = await legalAnalysisService.analyzeDocument(
  file,           // File objektum
  'contract',     // Elemzési típus
  'Megjegyzés'    // Opcionális megjegyzés
);

// Eredmények
console.log(result.risk);           // Kockázati szint
console.log(result.suggestions);    // Javítási javaslatok
console.log(result.confidence);     // Megbízhatósági pontszám
console.log(result.metrics);        // Teljesítmény metrikák
```

## Teljesítmény Metrikák

A szolgáltatás részletes teljesítmény metrikákat gyűjt:

```typescript
interface PerformanceMetrics {
  totalTime: number;           // Teljes feldolgozási idő (ms)
  textExtractionTime: number;  // Szöveg kinyerési idő (ms)
  chunkingTime: number;        // Chunk-okra bontás ideje (ms)
  analysisTime: number;        // Elemzési idő (ms)
  storageTime: number;         // Tárolási idő (ms)
  memoryUsage: number;         // Memóriahasználat (MB)
  chunkCount: number;          // Chunk-ok száma
  averageChunkSize: number;    // Átlagos chunk méret
  cacheHits: number;           // Cache találatok száma
  cacheMisses: number;         // Cache hiányok száma
}
```

## Hibakezelés

A szolgáltatás részletes hibakezelést biztosít:

```typescript
try {
  const result = await legalAnalysisService.analyzeDocument(file, 'contract');
} catch (error) {
  if (error instanceof ContractAnalysisError) {
    console.error('Hibakód:', error.code);
    console.error('Súlyosság:', error.severity);
    console.error('Részletek:', error.context);
  }
}
```

## Korlátozások

- Maximális fájlméret: 10MB
- Támogatott fájltípus: PDF
- Támogatott elemzési típusok: 'contract', 'policy', 'regulation'

## Teljesítmény Optimalizálás

### 1. Dokumentum Feldolgozás
- Adaptív chunk méret (500-4000 karakter)
- Mondat-alapú chunk-okra bontás
- Maximális 5 mondat per chunk
- Párhuzamos feldolgozás
- Memóriahasználat optimalizálása

### 2. Adatbázis Műveletek
- Tranzakció kezelés
- Párhuzamos beszúrások
- Indexek használata
- Aszinkron metrika tárolás

### 3. Elemzés
- Chunk-ok párhuzamos elemzése (10 chunk/batch)
- Duplikált eredmények eltávolítása
- Gyorsítótárazás (1000 elem, 30 perc élettartam)
- Batch-ek közötti kis késleltetés (100ms)

### 4. Cache Optimalizáció
- LRU (Least Recently Used) cache
- Memória-alapú méret számítás
- Automatikus cache törlés
- Cache statisztikák követése

## Fejlesztői Jegyzetek

### Teljesítmény Optimalizálási Tippek

1. **Dokumentum Feldolgozás**
   - Adaptív chunk méret használata
   - Mondat-alapú felosztás
   - Maximális mondatszám figyelése
   - Memóriahasználat monitorozása

2. **Adatbázis Műveletek**
   - Tranzakciók használata
   - Párhuzamos beszúrások
   - Indexek optimalizálása
   - Aszinkron metrika tárolás

3. **Elemzés**
   - Batch méret optimalizálása
   - Párhuzamos feldolgozás
   - Cache használat
   - Batch-ek közötti késleltetés

4. **Cache Kezelés**
   - Cache méret monitorozása
   - Élettartam beállítása
   - Memória felszabadítás
   - Statisztikák követése

### Hibakeresés

1. **Teljesítmény Problémák**
   - Teljesítmény metrikák ellenőrzése
   - Memóriahasználat monitorozása
   - Cache hatékonyság mérése
   - Batch feldolgozás optimalizálása

2. **Adatbázis Problémák**
   - Tranzakciók ellenőrzése
   - Párhuzamos műveletek monitorozása
   - Indexek hatékonysága
   - Metrika tárolás hibák

3. **Elemzési Problémák**
   - Chunk-ok minősége
   - Duplikált eredmények
   - Párhuzamos feldolgozás
   - Cache teljesítmény

4. **Cache Problémák**
   - Cache méret monitorozása
   - Élettartam beállítások
   - Memória felszabadítás
   - Cache statisztikák 