# Document Connectors

`DocumentSource` defines authorize/list/fetch/verify operations. Phase A includes an in-memory manual-upload adapter with type/size/hash checks, consent-gated synthetic DigiLocker documents, and mock GSTN/Udyam/MCA/PAN/land-record/department sources. The mock fixtures contain no real personal data. They are not network connectors and must not be treated as verification evidence from a government system.

## DigiLocker setup

The interface is ready for a real adapter, but Phase A deliberately does not guess token/document endpoints or simulate successful OAuth. Obtain partner access and the current API specifications through [API Setu DigiLocker resources](https://apisetu.gov.in/digilocker), then configure the client ID, secret, redirect URI, authorization endpoint, token endpoint, API base URL, scopes, and webhook/verification rules. Store secrets only in a secret manager. Never request or store Aadhaar OTPs.

UIDAI publishes current [Aadhaar authentication](https://uidai.gov.in/about-authentication), [requesting-agency](https://uidai.gov.in/authentication-requesting-agency), and [paperless offline e-KYC](https://uidai.gov.in/aadhaar-paperless-offline-e-kyc) information. Direct authentication requires the appropriate authorization and compliance; a prototype should prefer consented DigiLocker flows.

## WhatsApp setup

The gateway uses the official [WhatsApp Cloud API getting-started guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) and [Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup). Create a Meta Business app, connect a WhatsApp Business Account and phone number, configure a public HTTPS webhook, verify `X-Hub-Signature-256` with the app secret, and obtain production tokens through Meta's supported business flow. Keep access tokens server-side, collect opt-in before messaging, honor opt-outs and template rules, and minimize retained phone/message data. `WhatsAppGateway` sends only when all settings exist; otherwise it reports mock/non-delivery. The webhook audits counts only, never raw text or sender numbers. The friendly `/en/whatsapp` guide provides a pre-filled click-to-chat link only when `NEXT_PUBLIC_WHATSAPP_HELP_NUMBER` is configured.