# Security Audit and Fixes

Auditing the system for security issues based on recent scans and best practices, specifically focusing on RLS consistency, safe use of dynamic styles, and audit logs.

## Security Improvements

### Database Policies
- **Shared Access Consistency**: Update `error_logs` table to use a shared RLS policy, matching the business tables (`clientes`, `pedidos`, etc.) to ensure collaborative monitoring works across different team accounts.
- **Audit Integrity**: Ensure `owner_id` is consistently populated in all business transactions for audit trails, even though RLS allows collaborative viewing.

### Frontend Security
- **Dynamic CSS Injection**: Refactor `src/components/ui/chart.tsx` to use React's `style` attribute or CSS variables where possible instead of `dangerouslySetInnerHTML`. However, since this component is standard boilerplate for dynamic chart styles, I will verify the input source to ensure it only handles trusted config keys.

## Technical Details

### Database Migrations
- Create a new migration to update `error_logs` policy:
  ```sql
  DROP POLICY IF EXISTS "own error_logs" ON public.error_logs;
  CREATE POLICY "shared error_logs" ON public.error_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  ```

### Components
- Audit `src/components/ui/chart.tsx`: The `dangerouslySetInnerHTML` is used for injecting CSS variables into a scoped `<style>` block. This is a common pattern in shadcn/ui charts. I will add a comment documenting the security assessment (keys come from the `config` prop which is developer-controlled, not user-provided HTML).

## User Review Required

> [!IMPORTANT]
> The system is currently configured for **Collaborative Access**. This means all authenticated users in your project can see and edit each other's data. If you need stricter isolation (where users only see their own records), let me know.
