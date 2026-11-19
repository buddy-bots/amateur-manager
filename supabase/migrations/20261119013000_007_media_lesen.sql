-- Hochladen braucht auch Leserechte auf die Datei-Einträge (Bucket ist ohnehin öffentlich)
create policy media_read_objects on storage.objects for select to anon, authenticated using (bucket_id = 'media');
