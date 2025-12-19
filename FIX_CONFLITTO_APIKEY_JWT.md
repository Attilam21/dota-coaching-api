# 🔧 Fix: Conflitto tra apikey e Authorization Header

## Problema Identificato

Quando Supabase riceve sia `apikey` che `Authorization` header contemporaneamente, potrebbe:
- Usare solo l'`apikey` (anon key) 
- Ignorare il JWT nell'`Authorization` header
- Far fallire RLS perché non riconosce l'utente autenticato

## Soluzione Implementata

Custom fetch che:
1. **Verifica se c'è un JWT valido** nell'`Authorization` header
2. **Se c'è JWT**: Rimuove `apikey` per evitare conflitti
   - Supabase userà solo il JWT per determinare il ruolo (`authenticated`)
   - RLS riconoscerà correttamente `auth.uid()`
3. **Se non c'è JWT**: Mantiene `apikey` per richieste anonime

## Codice Implementato

```typescript
global: {
  fetch: async (url, options = {}) => {
    const headers = new Headers(options.headers)
    
    // Verifica se c'è un JWT valido nell'Authorization header
    const authHeader = headers.get('Authorization')
    const hasValidJWT = authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20
    
    if (hasValidJWT) {
      // JWT presente: rimuovi apikey per evitare conflitto
      headers.delete('apikey')
    } else {
      // Nessun JWT: mantieni apikey per richieste anonime
      if (!headers.has('apikey')) {
        headers.set('apikey', supabaseAnonKey)
      }
    }
    
    return fetch(url, {
      ...options,
      headers,
    })
  },
}
```

## Risultato Atteso

- ✅ Richieste autenticate: Solo `Authorization: Bearer <jwt>` (senza `apikey`)
- ✅ Richieste anonime: Solo `apikey` (senza `Authorization`)
- ✅ RLS riconosce correttamente `auth.uid()` per utenti autenticati
- ✅ Nessun conflitto tra i due header

## Test

Dopo questa modifica, le richieste a `/rest/v1/users` dovrebbero:
- ✅ Funzionare per utenti autenticati (200 OK invece di 403)
- ✅ Permettere SELECT, INSERT, UPDATE con RLS policies corrette

