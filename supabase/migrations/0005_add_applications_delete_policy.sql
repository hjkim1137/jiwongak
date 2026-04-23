create policy "applications_delete_own"
  on applications for delete using (auth.uid() = user_id);
