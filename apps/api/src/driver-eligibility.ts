export function requiredDocumentTypes(config = process.env.REQUIRED_DRIVER_DOCUMENTS || 'identity,vehicle,license') {
  return config.split(',').map((value) => value.trim()).filter(Boolean);
}

export function driverIsEligible(status: string, data: Record<string, any>, now = Date.now()) {
  if (status !== 'approved') return false;
  const documents = data?.documents || {};
  return requiredDocumentTypes().every((type) => {
    const document = documents[type];
    if (!document || !['approved', 'valid'].includes(document.status)) return false;
    if (!document.expiresAt) return true;
    const expiry = Date.parse(document.expiresAt);
    return Number.isFinite(expiry) && expiry > now;
  });
}
