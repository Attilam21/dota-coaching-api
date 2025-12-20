-- =====================================================
-- QUIZ SEED DATA - Domande iniziali per Dota Quiz
-- =====================================================

-- Rimuovi domande esistenti (opzionale, commenta se vuoi mantenere)
-- DELETE FROM public.quiz_questions;

-- =====================================================
-- CATEGORIA: HEROES (Eroi)
-- =====================================================

-- Facili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale eroe è conosciuto come "The Pudge"?', 'heroes', 'easy', 'Pudge', ARRAY['Butcher', 'Abaddon', 'Axe'], 'Pudge è l''eroe conosciuto come "The Pudge" o "The Butcher" in Dota 2.', 10),
('Quale eroe può rubare gli spell degli avversari?', 'heroes', 'easy', 'Rubick', ARRAY['Invoker', 'Puck', 'Storm Spirit'], 'Rubick è l''eroe che può rubare e usare gli ultimi degli avversari con il suo Spell Steal.', 10),
('Quale eroe ha l''abilità "Black Hole"?', 'heroes', 'easy', 'Enigma', ARRAY['Dark Seer', 'Shadow Fiend', 'Necrophos'], 'Enigma ha l''ultimo Black Hole, una delle abilità più potenti del gioco.', 10),
('Quale eroe può diventare invisibile con "Wind Walk"?', 'heroes', 'easy', 'Riki', ARRAY['Bounty Hunter', 'Clinkz', 'Weaver'], 'Riki ha l''abilità permanente Wind Walk che lo rende invisibile.', 10),
('Quale eroe è conosciuto come "The Anti-Mage"?', 'heroes', 'easy', 'Anti-Mage', ARRAY['Templar Assassin', 'Phantom Assassin', 'Queen of Pain'], 'Anti-Mage è l''eroe specializzato nel contrastare i maghi.', 10);

-- Medie
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale eroe può creare illusioni con "Manta Style" e "Conjure Image"?', 'heroes', 'medium', 'Naga Siren', ARRAY['Phantom Lancer', 'Chaos Knight', 'Terrorblade'], 'Naga Siren può creare illusioni con Mirror Image e beneficia molto da Manta Style.', 15),
('Quale eroe ha l''abilità "Chronosphere"?', 'heroes', 'medium', 'Faceless Void', ARRAY['Void Spirit', 'Enigma', 'Dark Seer'], 'Faceless Void ha l''ultimo Chronosphere che ferma il tempo in un''area.', 15),
('Quale eroe può teletrasportarsi globalmente con "Relocate"?', 'heroes', 'medium', 'Io (Wisp)', ARRAY['Nature''s Prophet', 'Tinker', 'Storm Spirit'], 'Io (Wisp) può teletrasportare se stesso e un alleato ovunque sulla mappa.', 15),
('Quale eroe ha l''abilità "Global Silence"?', 'heroes', 'medium', 'Silencer', ARRAY['Drow Ranger', 'Death Prophet', 'Necrophos'], 'Silencer ha l''ultimo Global Silence che silenzia tutti gli eroi nemici.', 15),
('Quale eroe può rubare statistiche con "Flesh Heap"?', 'heroes', 'medium', 'Pudge', ARRAY['Undying', 'Necrophos', 'Abaddon'], 'Pudge guadagna forza permanente ogni volta che uccide un nemico con Flesh Heap.', 15);

-- Difficili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale eroe può evocare 10 unità contemporaneamente con "Mass Serpent Wards"?', 'heroes', 'hard', 'Shadow Shaman', ARRAY['Witch Doctor', 'Enigma', 'Nature''s Prophet'], 'Shadow Shaman può evocare fino a 10 Serpent Wards con il suo ultimo.', 20),
('Quale eroe ha il cooldown più basso per il suo ultimo a livello 3?', 'heroes', 'hard', 'Invoker', ARRAY['Tinker', 'Storm Spirit', 'Queen of Pain'], 'Invoker con Aghanim''s Scepter può usare Invoke ogni 1.5 secondi.', 20),
('Quale eroe può negare se stesso con "Culling Blade"?', 'heroes', 'hard', 'Axe', ARRAY['Pudge', 'Legion Commander', 'Tusk'], 'Axe può negare se stesso (suicidarsi) con Culling Blade se ha meno del 25% HP.', 20);

-- =====================================================
-- CATEGORIA: ITEMS (Oggetti)
-- =====================================================

-- Facili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale item fornisce immunità alla magia per 5 secondi?', 'items', 'easy', 'Black King Bar (BKB)', ARRAY['Linken''s Sphere', 'Lotus Orb', 'Pipe of Insight'], 'BKB fornisce Magic Immunity per 5-10 secondi a seconda degli usi.', 10),
('Quale item può teletrasportarti alla base?', 'items', 'easy', 'Town Portal Scroll (TP)', ARRAY['Boots of Travel', 'Blink Dagger', 'Force Staff'], 'TP Scroll è l''item base che permette di teletrasportarsi alle torri.', 10),
('Quale item aumenta il danno critico?', 'items', 'easy', 'Daedalus', ARRAY['Monkey King Bar', 'Desolator', 'Mjollnir'], 'Daedalus fornisce 30% di chance di critico 2.4x.', 10),
('Quale item può rimuovere debuff negativi?', 'items', 'easy', 'Lotus Orb', ARRAY['Linken''s Sphere', 'BKB', 'Eul''s Scepter'], 'Lotus Orb rimuove debuff e riflette gli spell al caster.', 10),
('Quale item fornisce evasion?', 'items', 'easy', 'Butterfly', ARRAY['Manta Style', 'Satanic', 'Heart of Tarrasque'], 'Butterfly fornisce 35% di evasion e agilità.', 10);

-- Medie
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale item può bloccare un singolo spell nemico?', 'items', 'medium', 'Linken''s Sphere', ARRAY['Lotus Orb', 'BKB', 'Pipe of Insight'], 'Linken''s Sphere blocca automaticamente il prossimo spell target su di te.', 15),
('Quale item può essere usato per spingere via i nemici?', 'items', 'medium', 'Force Staff', ARRAY['Blink Dagger', 'Eul''s Scepter', 'Hurricane Pike'], 'Force Staff spinge te o un alleato/nemico nella direzione che stai guardando.', 15),
('Quale item fornisce il maggior danno base?', 'items', 'medium', 'Divine Rapier', ARRAY['Daedalus', 'Monkey King Bar', 'Abyssal Blade'], 'Divine Rapier fornisce +330 danno, ma viene droppato alla morte.', 15),
('Quale item può essere usato per purgare debuff?', 'items', 'medium', 'Eul''s Scepter of Divinity', ARRAY['Lotus Orb', 'BKB', 'Manta Style'], 'Eul''s può essere usato su te stesso o nemici per purgare e rendere invulnerabili.', 15),
('Quale item fornisce il maggior HP?', 'items', 'medium', 'Heart of Tarrasque', ARRAY['Satanic', 'Skadi', 'Bloodstone'], 'Heart of Tarrasque fornisce +1150 HP e rigenerazione.', 15);

-- Difficili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale item può essere combinato con Aghanim''s Scepter per ottenere un upgrade?', 'items', 'hard', 'Aghanim''s Shard', ARRAY['Refresher Orb', 'Octarine Core', 'Scythe of Vyse'], 'Aghanim''s Shard può essere combinato con Scepter per ottenere upgrade aggiuntivi.', 20),
('Quale item ha il cooldown più lungo?', 'items', 'hard', 'Refresher Orb', ARRAY['BKB', 'Black King Bar', 'Scythe of Vyse'], 'Refresher Orb ha un cooldown di 195 secondi, il più lungo tra gli item attivi.', 20);

-- =====================================================
-- CATEGORIA: MECHANICS (Meccaniche)
-- =====================================================

-- Facili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quanto dura lo stun di un Roshan kill?', 'mechanics', 'easy', '2 secondi', ARRAY['1 secondo', '3 secondi', '5 secondi'], 'Uccidere Roshan stunna tutti i nemici per 2 secondi.', 10),
('Quante rune spawnano ogni 2 minuti?', 'mechanics', 'easy', '2', ARRAY['1', '3', '4'], 'Due rune spawnano ogni 2 minuti: una Power Rune e una Bounty Rune.', 10),
('Quale è il tempo di respawn minimo?', 'mechanics', 'easy', '4 secondi', ARRAY['2 secondi', '6 secondi', '8 secondi'], 'Il tempo di respawn minimo è 4 secondi, aumenta con il livello.', 10),
('Quanto gold ricevi per un kill di First Blood?', 'mechanics', 'easy', '200 gold', ARRAY['150 gold', '250 gold', '300 gold'], 'First Blood dà 200 gold bonus al killer.', 10),
('Quante torri ci sono per team?', 'mechanics', 'easy', '11', ARRAY['9', '10', '12'], 'Ci sono 11 torri per team: 3 T1, 3 T2, 3 T3, 1 T4, 1 Ancient.', 10);

-- Medie
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale è il danno base di un creep melee?', 'mechanics', 'medium', '19-23', ARRAY['15-19', '23-27', '27-31'], 'I creep melee hanno danno base 19-23.', 15),
('Quanto tempo ci vuole per respawnare Roshan dopo la morte?', 'mechanics', 'medium', '8-11 minuti', ARRAY['5-8 minuti', '10-13 minuti', '12-15 minuti'], 'Roshan respawna tra 8 e 11 minuti dopo la morte.', 15),
('Quale è il range di attacco base di un eroe range?', 'mechanics', 'medium', '600', ARRAY['500', '550', '650'], 'La maggior parte degli eroi range ha 600 di range base.', 15),
('Quanto gold dà un kill assist?', 'mechanics', 'medium', 'Dipendente dal numero di assist', ARRAY['Fisso 100', 'Fisso 150', 'Fisso 200'], 'L''assist gold è diviso tra tutti gli assistenti, varia da 100-400.', 15),
('Quale è il cooldown di un Buyback?', 'mechanics', 'medium', '480 secondi', ARRAY['360 secondi', '420 secondi', '540 secondi'], 'Buyback ha un cooldown di 8 minuti (480 secondi).', 15);

-- Difficili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale è il moltiplicatore di danno critico massimo senza item?', 'mechanics', 'hard', '4.5x', ARRAY['3.5x', '4x', '5x'], 'Alcuni eroi come Phantom Assassin possono avere critici fino a 4.5x.', 20),
('Quanto tempo ci vuole per distruggere un Barracks?', 'mechanics', 'hard', 'Dipendente dal danno', ARRAY['30 secondi', '60 secondi', 'Fisso'], 'I Barracks hanno 1500 HP, il tempo dipende dal danno inflitto.', 20);

-- =====================================================
-- CATEGORIA: STRATEGY (Strategia)
-- =====================================================

-- Facili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale è l''obiettivo principale del gioco?', 'strategy', 'easy', 'Distruggere l''Ancient nemico', ARRAY['Uccidere Roshan', 'Raggiungere livello 25', 'Fare più kill'], 'L''obiettivo è distruggere l''Ancient nemico nella base.', 10),
('Quando è meglio fare Roshan?', 'strategy', 'easy', 'Dopo un teamfight vinto', ARRAY['All''inizio del gioco', 'Quando si è in svantaggio', 'Sempre'], 'Roshan è più sicuro dopo aver vinto un teamfight o quando i nemici sono morti.', 10),
('Quale ruolo è responsabile del farm principale?', 'strategy', 'easy', 'Carry', ARRAY['Support', 'Mid', 'Offlane'], 'Il Carry è il ruolo che deve farmare per diventare forte in late game.', 10),
('Quando è meglio pushare le lane?', 'strategy', 'easy', 'Dopo aver ucciso nemici', ARRAY['Sempre', 'Mai', 'Solo in late game'], 'Pushare dopo aver ucciso nemici permette di prendere torri in sicurezza.', 10),
('Quale è il ruolo principale dei Support?', 'strategy', 'easy', 'Warding e proteggere il Carry', ARRAY['Fare kill', 'Farmare', 'Pushare'], 'I Support devono wardare, dewardare e proteggere il Carry.', 10);

-- Medie
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quando è meglio fare smoke gank?', 'strategy', 'medium', 'Quando i nemici sono in lane', ARRAY['Sempre', 'Solo in late game', 'Mai'], 'Smoke gank funziona meglio quando i nemici sono occupati in lane.', 15),
('Quale è la strategia migliore contro un team con molti stun?', 'strategy', 'medium', 'Comprare BKB e Linken', ARRAY['Fare più danno', 'Pushare', 'Farmare'], 'Contro molti stun, BKB e Linken sono essenziali per la sopravvivenza.', 15),
('Quando è meglio fare split push?', 'strategy', 'medium', 'Quando il team è in svantaggio', ARRAY['Sempre', 'Mai', 'Solo in early game'], 'Split push permette di creare pressione quando si è in svantaggio numerico.', 15),
('Quale è il timing migliore per fare Aegis?', 'strategy', 'medium', 'Prima di un push importante', ARRAY['All''inizio', 'Solo in late game', 'Mai'], 'Aegis è più utile quando si vuole pushare o fare teamfight decisivi.', 15),
('Quando è meglio fare High Ground?', 'strategy', 'medium', 'Con Aegis o vantaggio numerico', ARRAY['Sempre', 'Mai', 'Solo in early game'], 'High Ground è più sicuro con Aegis o quando si ha vantaggio numerico.', 15);

-- Difficili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale è la strategia migliore contro un team con molti carry?', 'strategy', 'hard', 'End game prima del 40 minuto', ARRAY['Farmare di più', 'Fare più teamfight', 'Split push'], 'Contro molti carry, è meglio finire il gioco prima che diventino troppo forti.', 20),
('Quando è meglio fare Roshan senza visione?', 'strategy', 'hard', 'Mai, sempre wardare prima', ARRAY['Sempre', 'Solo in late game', 'Quando si è in vantaggio'], 'Roshan senza visione è estremamente rischioso, sempre wardare prima.', 20);

-- =====================================================
-- CATEGORIA: META (Meta Game)
-- =====================================================

-- Facili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale ruolo è solitamente nel mid lane?', 'meta', 'easy', 'Midlaner', ARRAY['Carry', 'Support', 'Offlaner'], 'Il Midlaner gioca nella lane centrale, solitamente eroi con forte presenza early.', 10),
('Quale è il ruolo principale dell''Offlaner?', 'meta', 'easy', 'Creare spazio e controllare la lane', ARRAY['Farmare', 'Supportare', 'Fare kill'], 'L''Offlaner deve creare spazio e controllare la lane opposta al Carry.', 10),
('Quanti eroi ci sono in un team?', 'meta', 'easy', '5', ARRAY['4', '6', '7'], 'Ogni team ha 5 eroi: 1 Carry, 1 Mid, 1 Offlane, 2 Support.', 10),
('Quale è il ruolo più importante in late game?', 'meta', 'easy', 'Carry', ARRAY['Support', 'Mid', 'Offlane'], 'Il Carry è il ruolo più importante in late game quando ha farmato abbastanza.', 10),
('Quale è l''obiettivo principale dell''early game?', 'meta', 'easy', 'Farmare e controllare le lane', ARRAY['Pushare', 'Fare teamfight', 'Uccidere Roshan'], 'L''early game si concentra su farm e controllo delle lane.', 10);

-- Medie
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale è il timing tipico per il primo Roshan?', 'meta', 'medium', '15-20 minuti', ARRAY['5-10 minuti', '10-15 minuti', '20-25 minuti'], 'Il primo Roshan viene solitamente fatto tra 15-20 minuti quando il team ha abbastanza danno.', 15),
('Quale è la composizione team ideale?', 'meta', 'medium', 'Bilanciata tra stun, danno e support', ARRAY['Solo carry', 'Solo support', 'Solo stun'], 'Un team bilanciato ha stun, danno, support e capacità di push.', 15),
('Quando inizia il late game?', 'meta', 'medium', 'Dopo 30-35 minuti', ARRAY['Dopo 20 minuti', 'Dopo 40 minuti', 'Dopo 50 minuti'], 'Il late game inizia quando i carry hanno i loro item core completati, solitamente dopo 30-35 minuti.', 15),
('Quale è l''importanza delle rune?', 'meta', 'medium', 'Cruciali per mid e gank', ARRAY['Poco importanti', 'Solo per late game', 'Solo per support'], 'Le rune sono cruciali per il midlaner e per i gank, specialmente Haste e Invisibility.', 15),
('Quale è il ruolo dei Support in teamfight?', 'meta', 'medium', 'Stun, save e controllo', ARRAY['Fare danno', 'Farmare', 'Pushare'], 'I Support devono usare stun, salvare alleati e controllare i nemici in teamfight.', 15);

-- Difficili
INSERT INTO public.quiz_questions (question, category, difficulty, correct_answer, wrong_answers, explanation, points) VALUES
('Quale è la strategia meta attuale per il mid game?', 'meta', 'hard', 'Dipende dal patch e composizione', ARRAY['Sempre pushare', 'Sempre farmare', 'Sempre teamfight'], 'La meta cambia con ogni patch, la strategia dipende dalla composizione team.', 20),
('Quale è l''importanza del timing window?', 'meta', 'hard', 'Cruciale per decidere quando fare teamfight', ARRAY['Poco importante', 'Solo per late game', 'Solo per early game'], 'I timing window sono cruciali: fare teamfight quando si ha vantaggio di item/livelli.', 20);

-- =====================================================
-- VERIFICA
-- =====================================================
-- Esegui questa query per verificare le domande inserite:
-- SELECT category, difficulty, COUNT(*) as count FROM public.quiz_questions GROUP BY category, difficulty ORDER BY category, difficulty;

