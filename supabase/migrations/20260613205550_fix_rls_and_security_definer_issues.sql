-- 1. Drop the always-true UPDATE policy — it lets any authenticated user update any invite row.
--    The existing "Authenticated users can accept invites" policy already handles the legitimate
--    use case (pending → accepted), so this one is purely a security hole.
DROP POLICY IF EXISTS "Authenticated users can update invite status" ON public.project_invites;

-- 2. Revoke EXECUTE on the trigger helper from public-facing roles.
--    update_updated_at_column() is a SECURITY DEFINER trigger function; it has no business
--    being callable via /rest/v1/rpc by anonymous or authenticated users.
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;
