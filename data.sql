SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict lFUT826KHI0BOb9jEN8QOXwzNAb8YB8UtnSRsBXDTi5vnuEAjuMkyPboJ6B12Zg

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at", "custom_claims_allowlist") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	8aec2716-0268-48e6-a3e4-80a542fd7028	authenticated	authenticated	gavinmwiese@gmail.com	$2a$10$Itgi07KLcrMZfSBPmH3ilu5OPEjSpnhyGpPxWOxeQSwRkbUAvmzv6	2026-03-15 19:04:00.581675+00	\N		2026-03-15 19:03:41.11069+00		\N			\N	2026-05-24 15:42:45.021589+00	{"provider": "email", "providers": ["email"]}	{"sub": "8aec2716-0268-48e6-a3e4-80a542fd7028", "email": "gavinmwiese@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-03-15 19:03:41.015443+00	2026-06-26 20:26:38.555653+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
8aec2716-0268-48e6-a3e4-80a542fd7028	8aec2716-0268-48e6-a3e4-80a542fd7028	{"sub": "8aec2716-0268-48e6-a3e4-80a542fd7028", "email": "gavinmwiese@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-03-15 19:03:41.082343+00	2026-03-15 19:03:41.082391+00	2026-03-15 19:03:41.082391+00	e748a0d6-d81f-4721-b939-84f99ada64e3
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
bcba58c3-b34f-4f6b-a781-f3cf6a197404	8aec2716-0268-48e6-a3e4-80a542fd7028	2026-04-15 03:24:53.997572+00	2026-06-26 20:26:38.567168+00	\N	aal1	\N	2026-06-26 20:26:38.567064	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0	208.190.142.71	\N	\N	\N	\N	\N
fc122cc2-f654-41a5-b054-c7329b25ecd4	8aec2716-0268-48e6-a3e4-80a542fd7028	2026-05-24 15:42:45.021683+00	2026-05-24 15:42:45.021683+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0	134.215.113.35	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
bcba58c3-b34f-4f6b-a781-f3cf6a197404	2026-04-15 03:24:54.034211+00	2026-04-15 03:24:54.034211+00	password	4b952f5f-92dc-460c-b7f2-cf7307f92f92
fc122cc2-f654-41a5-b054-c7329b25ecd4	2026-05-24 15:42:45.044675+00	2026-05-24 15:42:45.044675+00	password	3ec06b6a-e29e-4b1a-b84f-9b0830ad4080
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	144	rfqkp6frtrjy	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-17 23:42:55.156309+00	2026-06-22 02:51:58.016101+00	ypfjsxyi3igh	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	81	y4ct66rtw24q	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-19 02:01:00.811462+00	2026-04-19 03:04:19.940408+00	ndesqfqftlop	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	83	xm2soddul6ll	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-20 16:00:34.275099+00	2026-04-20 17:41:58.745784+00	fxx5j36idmmv	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	145	s3btoiulvgzx	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-22 02:51:58.04409+00	2026-06-22 03:54:47.463643+00	rfqkp6frtrjy	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	85	osvuavfsfmtu	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-20 22:02:12.559724+00	2026-04-21 14:23:52.090805+00	utzudlqvmoda	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	87	oia5nmufxa6g	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-21 17:13:10.446992+00	2026-04-21 19:30:59.982048+00	vipqd2mx24sk	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	147	7l3h3yofsa5q	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-22 04:56:40.283447+00	2026-06-22 06:15:11.890277+00	r2zsmmrg5vgd	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	89	lxnjvuu2lzf2	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-21 22:48:24.860925+00	2026-04-22 20:26:24.759472+00	sfoahnqvqshc	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	91	jwesdo6o2hav	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-23 00:22:30.382037+00	2026-04-23 01:28:18.279955+00	2zcsmym2gjoh	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	149	26oapnl4pfkm	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-22 07:42:03.720265+00	2026-06-23 01:33:47.715427+00	ca6tdyd47e4c	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	93	wrqd43f5bopx	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-23 02:32:38.75175+00	2026-04-23 04:12:34.596528+00	km4t53q6yugh	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	95	2knvjzn2pkd6	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-23 13:19:37.666431+00	2026-04-24 04:19:52.578486+00	tdqfthizpsec	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	151	o53v3gqz3mv5	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-23 02:37:31.161502+00	2026-06-23 03:58:54.863759+00	73l6ziqaf2ix	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	97	f4he7zkd7wua	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-24 05:18:53.090491+00	2026-04-25 03:14:12.545221+00	dj3atgfbjc36	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	99	24cnxp65oxs3	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-26 15:06:31.929811+00	2026-04-27 22:24:53.289418+00	q5xagws4bfbl	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	153	ybxhllsbjj33	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-23 07:57:31.214009+00	2026-06-26 00:34:43.707356+00	5g2uoxuyytbn	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	101	5r64htcnxzvr	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-29 23:58:32.049486+00	2026-05-21 00:18:14.568377+00	jdpkyonl774c	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	102	ybi3eapv62gs	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-21 00:18:14.578844+00	2026-05-21 04:05:13.912235+00	5r64htcnxzvr	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	104	i7g7vbor3ehi	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-21 05:04:35.750059+00	2026-05-21 18:30:43.256752+00	7hwkr7aza6eg	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	155	yuwpdy6yonx3	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 01:36:11.039443+00	2026-06-26 02:35:52.117754+00	nk7lsgmz7sum	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	106	65ibmbfth2er	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-22 00:41:53.719391+00	2026-05-22 03:10:42.864802+00	xzy4r7lifaxa	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	108	gwgkotjucjql	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-22 04:09:04.874581+00	2026-05-22 05:11:18.510166+00	j44h52hzz2md	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	157	gi5okrgmueva	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 02:35:52.118588+00	2026-06-26 03:33:59.240358+00	yuwpdy6yonx3	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	110	os5dh7ik2sou	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-22 19:58:57.465811+00	2026-05-22 21:44:59.374678+00	fwyg4nrm34mf	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	112	bstsctzet2ad	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-24 15:42:44.995441+00	2026-06-05 02:53:50.220134+00	f2semktr3t3i	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	159	ggbepmzwp36r	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 13:32:25.085757+00	2026-06-26 14:48:23.924646+00	ib3edlvci43l	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	114	7susvjytngxw	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-05 02:53:50.229716+00	2026-06-05 03:57:25.700068+00	bstsctzet2ad	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	116	e6lanztxs4gl	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-05 21:31:11.157119+00	2026-06-07 14:19:38.971218+00	kp3aimhbqz3u	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	161	qqyukqugcvqk	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 15:46:33.712452+00	2026-06-26 17:38:38.004072+00	ppswii2yyq4u	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	118	cp4fbncsc57z	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-07 16:01:55.772702+00	2026-06-07 17:00:18.297087+00	a2iqvppebmps	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	120	trykb57omh27	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-08 01:28:12.311515+00	2026-06-08 02:32:15.838549+00	xyfs54m772mj	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	163	rgiqwluunmvi	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 19:13:27.900877+00	2026-06-26 20:26:38.527901+00	erpbs57udqtk	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	122	kkrg534yt64t	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-08 03:43:44.155168+00	2026-06-08 04:43:43.967082+00	kvoo4mzusrpl	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	124	xuxpr2o2rcxu	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-08 11:49:10.299064+00	2026-06-08 17:34:56.933472+00	mg2ogzakbte7	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	126	75c64afsilvt	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-08 22:00:25.899821+00	2026-06-09 13:04:21.963093+00	bpn4gftinqfc	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	128	ncog4k27tqik	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-09 20:18:23.271248+00	2026-06-09 22:40:34.19991+00	qt33pyhstrxg	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	130	3ixhlzszz7fl	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-09 23:39:54.955868+00	2026-06-10 00:38:21.893474+00	g5jcjrh3qetf	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	132	wysrvet75ewt	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 01:36:55.016802+00	2026-06-10 02:34:59.880514+00	4mt3xtkvfdds	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	134	cwqqaorwzpyu	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 03:33:17.16584+00	2026-06-10 15:06:04.19969+00	m36xoppyiln6	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	136	ikaunfvpj5t6	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 16:04:30.520372+00	2026-06-10 17:03:28.962368+00	eabe25u5p5a3	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	138	2j5get6ir3ce	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 18:21:11.798632+00	2026-06-10 20:41:01.630071+00	dtpzxwhfikd2	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	140	2ck6ogig4kiq	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-11 17:06:56.252129+00	2026-06-16 00:30:18.822592+00	wkzyo6zvr5m2	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	142	gov5mflmo2ss	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-16 15:17:20.664005+00	2026-06-17 06:52:25.410057+00	ajhxzdd37q5e	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	80	ndesqfqftlop	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-15 03:24:54.01799+00	2026-04-19 02:01:00.80087+00	\N	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	82	fxx5j36idmmv	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-19 03:04:19.965768+00	2026-04-20 16:00:34.248269+00	y4ct66rtw24q	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	146	r2zsmmrg5vgd	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-22 03:54:47.48298+00	2026-06-22 04:56:40.260467+00	s3btoiulvgzx	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	84	utzudlqvmoda	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-20 17:41:58.771687+00	2026-04-20 22:02:12.535347+00	xm2soddul6ll	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	86	vipqd2mx24sk	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-21 14:23:52.118122+00	2026-04-21 17:13:10.417175+00	osvuavfsfmtu	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	148	ca6tdyd47e4c	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-22 06:15:11.905847+00	2026-06-22 07:42:03.704065+00	7l3h3yofsa5q	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	88	sfoahnqvqshc	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-21 19:30:59.990666+00	2026-04-21 22:48:24.853162+00	oia5nmufxa6g	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	90	2zcsmym2gjoh	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-22 20:26:24.795775+00	2026-04-23 00:22:30.363326+00	lxnjvuu2lzf2	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	150	73l6ziqaf2ix	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-23 01:33:47.745761+00	2026-06-23 02:37:31.146349+00	26oapnl4pfkm	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	92	km4t53q6yugh	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-23 01:28:18.291128+00	2026-04-23 02:32:38.725565+00	jwesdo6o2hav	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	94	tdqfthizpsec	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-23 04:12:34.605102+00	2026-04-23 13:19:37.635921+00	wrqd43f5bopx	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	152	5g2uoxuyytbn	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-23 03:58:54.874245+00	2026-06-23 07:57:31.20536+00	o53v3gqz3mv5	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	96	dj3atgfbjc36	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-24 04:19:52.608608+00	2026-04-24 05:18:53.069556+00	2knvjzn2pkd6	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	98	q5xagws4bfbl	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-25 03:14:12.559266+00	2026-04-26 15:06:31.893922+00	f4he7zkd7wua	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	154	nk7lsgmz7sum	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 00:34:43.729247+00	2026-06-26 01:36:11.012214+00	ybxhllsbjj33	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	100	jdpkyonl774c	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-04-27 22:24:53.32321+00	2026-04-29 23:58:32.025325+00	24cnxp65oxs3	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	103	7hwkr7aza6eg	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-21 04:05:13.942952+00	2026-05-21 05:04:35.72941+00	ybi3eapv62gs	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	105	xzy4r7lifaxa	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-21 18:30:43.291309+00	2026-05-22 00:41:53.700771+00	i7g7vbor3ehi	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	158	ib3edlvci43l	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 03:33:59.257011+00	2026-06-26 13:32:25.075122+00	gi5okrgmueva	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	107	j44h52hzz2md	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-22 03:10:42.883384+00	2026-05-22 04:09:04.854315+00	65ibmbfth2er	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	109	fwyg4nrm34mf	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-22 05:11:18.531638+00	2026-05-22 19:58:57.441775+00	gwgkotjucjql	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	160	ppswii2yyq4u	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 14:48:23.938963+00	2026-06-26 15:46:33.703146+00	ggbepmzwp36r	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	111	f2semktr3t3i	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-05-22 21:44:59.403924+00	2026-05-24 15:42:44.969532+00	os5dh7ik2sou	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	113	wkxpr5jjtxuo	8aec2716-0268-48e6-a3e4-80a542fd7028	f	2026-05-24 15:42:45.039688+00	2026-05-24 15:42:45.039688+00	\N	fc122cc2-f654-41a5-b054-c7329b25ecd4
00000000-0000-0000-0000-000000000000	115	kp3aimhbqz3u	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-05 03:57:25.72767+00	2026-06-05 21:31:11.146352+00	7susvjytngxw	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	162	erpbs57udqtk	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-26 17:38:38.013261+00	2026-06-26 19:13:27.872238+00	qqyukqugcvqk	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	117	a2iqvppebmps	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-07 14:19:38.999122+00	2026-06-07 16:01:55.747414+00	e6lanztxs4gl	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	164	fyc2bu4baigt	8aec2716-0268-48e6-a3e4-80a542fd7028	f	2026-06-26 20:26:38.546967+00	2026-06-26 20:26:38.546967+00	rgiqwluunmvi	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	119	xyfs54m772mj	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-07 17:00:18.319545+00	2026-06-08 01:28:12.283433+00	cp4fbncsc57z	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	121	kvoo4mzusrpl	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-08 02:32:15.863675+00	2026-06-08 03:43:44.127566+00	trykb57omh27	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	123	mg2ogzakbte7	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-08 04:43:43.984506+00	2026-06-08 11:49:10.264757+00	kkrg534yt64t	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	125	bpn4gftinqfc	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-08 17:34:56.9515+00	2026-06-08 22:00:25.871472+00	xuxpr2o2rcxu	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	127	qt33pyhstrxg	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-09 13:04:21.986382+00	2026-06-09 20:18:23.252181+00	75c64afsilvt	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	129	g5jcjrh3qetf	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-09 22:40:34.218308+00	2026-06-09 23:39:54.937801+00	ncog4k27tqik	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	131	4mt3xtkvfdds	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 00:38:21.905309+00	2026-06-10 01:36:54.991103+00	3ixhlzszz7fl	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	133	m36xoppyiln6	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 02:34:59.902463+00	2026-06-10 03:33:17.142801+00	wysrvet75ewt	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	135	eabe25u5p5a3	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 15:06:04.229374+00	2026-06-10 16:04:30.503618+00	cwqqaorwzpyu	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	137	dtpzxwhfikd2	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 17:03:28.97681+00	2026-06-10 18:21:11.778152+00	ikaunfvpj5t6	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	139	wkzyo6zvr5m2	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-10 20:41:01.649506+00	2026-06-11 17:06:56.224764+00	2j5get6ir3ce	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	141	ajhxzdd37q5e	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-16 00:30:18.852983+00	2026-06-16 15:17:20.637728+00	2ck6ogig4kiq	bcba58c3-b34f-4f6b-a781-f3cf6a197404
00000000-0000-0000-0000-000000000000	143	ypfjsxyi3igh	8aec2716-0268-48e6-a3e4-80a542fd7028	t	2026-06-17 06:52:25.434371+00	2026-06-17 23:42:55.129736+00	gov5mflmo2ss	bcba58c3-b34f-4f6b-a781-f3cf6a197404
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: benoni_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."benoni_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
b6e0cb1e-342b-47aa-8088-7e91dae35740	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 Nf6 2. c4 c5 3. d5	1. d4 Nf6 2. c4 c5 3. d5
\.


--
-- Data for Name: caro_kann_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."caro_kann_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
33245648-abf2-4255-a98f-3c4ef95f2c54	8aec2716-0268-48e6-a3e4-80a542fd7028	1. e4 c6	1. e4 c6 2. d4 d5
\.


--
-- Data for Name: catalan_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."catalan_progress" ("id", "user_id", "base_line", "main_line", "closed_main_line") FROM stdin;
4803ac34-02bc-4815-9284-e2f67b817890	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 Nf6 2. c4 e6 3. g3	1. d4 Nf6 2. c4 e6 3. g3 d5 4. cxd5 exd5 5. Nf3	1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O dxc4
\.


--
-- Data for Name: classic_game_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."classic_game_results" ("id", "user_id", "accuracy", "created_at", "result", "opening") FROM stdin;
a2dc9be8-3a36-4403-b8cf-7c7e430597c4	8aec2716-0268-48e6-a3e4-80a542fd7028	97.3	2026-03-29 02:11:26.73588+00	Win	King's Indian
17a48954-14f0-4102-96b7-89b10f875686	8aec2716-0268-48e6-a3e4-80a542fd7028	87.7	2026-03-29 18:50:11.900826+00	Loss	Reti
69c05262-2d64-4a8d-92a1-ecfc34499b1d	8aec2716-0268-48e6-a3e4-80a542fd7028	67.2	2026-03-29 19:10:12.273331+00	Loss	Reti
57cfcf42-9d28-4948-beb3-f2388661607d	8aec2716-0268-48e6-a3e4-80a542fd7028	80.3	2026-03-29 19:15:48.028044+00	Loss	Reti
051cf271-63b8-42c0-85d1-a1be0c32173b	8aec2716-0268-48e6-a3e4-80a542fd7028	70.7	2026-03-29 19:24:55.872246+00	Loss	None
9ffa474a-5a2c-4461-8a1b-869664bddd7a	8aec2716-0268-48e6-a3e4-80a542fd7028	39.3	2026-03-29 19:37:15.723137+00	Loss	Reti
4407bb2c-4ab9-415b-9548-cd8b07252708	8aec2716-0268-48e6-a3e4-80a542fd7028	94.3	2026-03-29 19:49:56.113103+00	Loss	Reti
fd8cd0b3-a6bd-417a-aa5d-378cb0c78f00	8aec2716-0268-48e6-a3e4-80a542fd7028	85.1	2026-03-29 19:57:12.200566+00	Win	Reti
b5de4d79-51a0-4eea-ae74-6a568e5e540a	8aec2716-0268-48e6-a3e4-80a542fd7028	88.9	2026-03-29 20:36:16.701467+00	Win	Queen's Gambit Declined
ae8f18dc-ddd4-4abc-aec0-c70a566b584e	8aec2716-0268-48e6-a3e4-80a542fd7028	90.1	2026-03-29 20:59:26.349658+00	Win	French
5fd09fba-6e0c-4e03-992e-93d127dae9c9	8aec2716-0268-48e6-a3e4-80a542fd7028	84.9	2026-03-29 21:09:46.615811+00	Win	None
800da020-6688-4d1b-8de0-d610f7c400f3	8aec2716-0268-48e6-a3e4-80a542fd7028	100.6	2026-03-29 21:23:15.499567+00	Win	Benoni
714ce56c-d1b6-406c-9eb4-1caa906b97ec	8aec2716-0268-48e6-a3e4-80a542fd7028	88.1	2026-03-29 22:36:52.314835+00	Win	None
090d1b18-5ca1-40d8-aac0-1e02172075df	8aec2716-0268-48e6-a3e4-80a542fd7028	91.8	2026-03-30 04:44:33.278809+00	Win	None
e7e1a5d8-efea-48d6-8991-6cabad1e683b	8aec2716-0268-48e6-a3e4-80a542fd7028	97.5	2026-03-30 04:59:41.940555+00	Win	None
e131476f-eb15-442d-8340-f99c62704d6c	8aec2716-0268-48e6-a3e4-80a542fd7028	64.9	2026-04-02 20:38:25.681392+00	Loss	None
2a6f9284-f305-452a-a84c-f231a8a341ac	8aec2716-0268-48e6-a3e4-80a542fd7028	84.9	2026-04-03 05:03:00.002538+00	Win	None
e85d59cf-a30d-490d-abe7-9733656627fb	8aec2716-0268-48e6-a3e4-80a542fd7028	94.9	2026-04-05 17:59:49.531611+00	Win	Caro-Kann
79159cc7-f7fe-43e5-93f9-7f2948f4d278	8aec2716-0268-48e6-a3e4-80a542fd7028	77.9	2026-04-06 02:07:26.539913+00	Loss	Caro-Kann
98fb1379-e0bf-4398-9b1f-dbe7c61175dd	8aec2716-0268-48e6-a3e4-80a542fd7028	86.1	2026-04-15 01:25:27.585611+00	Win	Caro-Kann
0e942b3c-2ff9-4271-a46a-648cc4f58d91	8aec2716-0268-48e6-a3e4-80a542fd7028	90	2026-04-15 02:34:59.695973+00	Win	Caro-Kann
809b42e5-cd3b-49ad-b6bb-da7ed89547af	8aec2716-0268-48e6-a3e4-80a542fd7028	85.8	2026-04-15 03:04:37.727432+00	Win	Catalan
7a345ecb-eb28-4264-bbdb-84b6a6e75096	8aec2716-0268-48e6-a3e4-80a542fd7028	80.2	2026-04-20 17:51:24.03762+00	Loss	Caro-Kann
33a561aa-20ba-44be-9d78-6a42428e7299	8aec2716-0268-48e6-a3e4-80a542fd7028	77.4	2026-04-21 23:06:44.837029+00	Loss	None
040d25b2-3d0b-47e1-a652-b199e09c720d	8aec2716-0268-48e6-a3e4-80a542fd7028	91.4	2026-04-22 20:35:54.096815+00	Win	None
a1a2a7cb-f1d8-4333-96e7-73f69ae97768	8aec2716-0268-48e6-a3e4-80a542fd7028	97.3	2026-04-23 01:32:35.775903+00	Win	Caro-Kann
ef6da405-46a1-4797-b87a-301165319ec5	8aec2716-0268-48e6-a3e4-80a542fd7028	92.2	2026-04-23 01:41:57.300094+00	Win	French
b99ade70-a303-4f69-bab3-efda82a32bb0	8aec2716-0268-48e6-a3e4-80a542fd7028	92.9	2026-04-23 02:18:23.900922+00	Win	English
da6b7ad3-9d1e-4716-9bbc-6cb6b4056c4d	8aec2716-0268-48e6-a3e4-80a542fd7028	90.9	2026-04-24 05:33:34.299056+00	Win	Benoni
096b4be6-9774-4359-83f6-65ab8f80b615	8aec2716-0268-48e6-a3e4-80a542fd7028	91	2026-04-24 05:53:29.18354+00	Win	Benoni
74f602bc-720f-4170-b95e-32129349a240	8aec2716-0268-48e6-a3e4-80a542fd7028	100	2026-04-24 05:58:15.087894+00	Win	Italian
45a71da9-a8b1-4a97-aacb-eb75ff46168b	8aec2716-0268-48e6-a3e4-80a542fd7028	96.1	2026-04-24 06:10:12.258886+00	Win	Gruenfeld
549abbf7-3953-462f-82b5-64bb0c6ffbfc	8aec2716-0268-48e6-a3e4-80a542fd7028	95.2	2026-04-25 03:20:52.815804+00	Win	Italian
0e64ce64-7fa9-410a-867a-f800f900cab6	8aec2716-0268-48e6-a3e4-80a542fd7028	82.8	2026-04-25 03:35:01.133728+00	Win	Ruy Lopez
6818bf0b-2bb7-44b3-b04e-9af234f50cbd	8aec2716-0268-48e6-a3e4-80a542fd7028	79.4	2026-04-25 03:48:39.725324+00	Loss	Sicilian
0c3b6044-5ed2-44ab-b681-987f65764b1f	8aec2716-0268-48e6-a3e4-80a542fd7028	77.5	2026-04-30 00:03:28.468719+00	Win	Queen's Gambit Declined
7e4457bb-a30f-43de-8777-8c9152f7b490	8aec2716-0268-48e6-a3e4-80a542fd7028	68.7	2026-05-21 00:34:16.148754+00	Win	King's Indian
911a221b-ae5d-4330-a7fb-064469835e52	8aec2716-0268-48e6-a3e4-80a542fd7028	80.5	2026-06-10 20:46:25.349386+00	Win	Reti
3412a521-b4ad-4a0d-bbd1-96c1b847a71e	8aec2716-0268-48e6-a3e4-80a542fd7028	88.4	2026-06-22 07:50:17.72851+00	Win	French
159678f9-842b-49cf-ac27-d73091819a1f	8aec2716-0268-48e6-a3e4-80a542fd7028	83.1	2026-06-23 02:23:10.009815+00	Win	None
0e67d993-b939-4099-ad00-8d30b0e465c9	8aec2716-0268-48e6-a3e4-80a542fd7028	93.2	2026-06-23 02:27:15.98367+00	Win	French
8dc5f810-31ec-4894-b7ce-7e46849c2acf	8aec2716-0268-48e6-a3e4-80a542fd7028	44.4	2026-06-23 08:11:00.11319+00	Loss	English
05f4a4c5-33ee-4e3b-a383-c4d8ab6492ac	8aec2716-0268-48e6-a3e4-80a542fd7028	58.6	2026-06-26 18:30:01.087457+00	Loss	English
\.


--
-- Data for Name: daily_game_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."daily_game_results" ("id", "user_id", "accuracy", "created_at", "daily_id", "daily_score") FROM stdin;
118e942f-08e5-4874-a331-4958933dbb3b	8aec2716-0268-48e6-a3e4-80a542fd7028	85.1	2026-06-08 22:08:13.588926+00	2026-06-08	137.5216
64f3ace7-d449-4f02-bfce-2f8fdbdb5f9f	8aec2716-0268-48e6-a3e4-80a542fd7028	103.8	2026-06-09 22:58:28.233922+00	2026-06-09	109.6128
8b724190-30d7-4eb8-9a6c-cc895ad71729	8aec2716-0268-48e6-a3e4-80a542fd7028	47.8	2026-06-09 23:10:44.317909+00	2026-06-09	57.5512
a1850ec0-b90d-4bf0-ad0f-1b3b137fd71f	8aec2716-0268-48e6-a3e4-80a542fd7028	91.9	2026-06-09 23:20:24.964992+00	2026-06-09	119.47
fc6e93ab-da29-41a7-907d-1f211df4d7dc	8aec2716-0268-48e6-a3e4-80a542fd7028	87.7	2026-06-09 23:29:36.87518+00	2026-06-09	123.1308
15832aa4-314c-4c79-8069-64c00cc52257	8aec2716-0268-48e6-a3e4-80a542fd7028	86.4	2026-06-09 23:48:16.351826+00	2026-06-09	106.7904
858823ab-a126-468e-90b3-0e0245c73073	8aec2716-0268-48e6-a3e4-80a542fd7028	46.9	2026-06-09 23:52:23.818492+00	2026-06-09	59.4692
1190a265-6edf-427f-b179-67dfef49a1dd	8aec2716-0268-48e6-a3e4-80a542fd7028	55	2026-06-09 23:55:12.164202+00	2026-06-09	75.02
bc89952e-0ed0-444b-8403-9e2a84cd674d	8aec2716-0268-48e6-a3e4-80a542fd7028	69.9	2026-06-10 00:06:04.522248+00	2026-06-10	88.3536
5ffa76f2-7489-4ba8-bf9b-0bfa3e2e49bf	8aec2716-0268-48e6-a3e4-80a542fd7028	97.9	2026-06-10 00:12:47.008069+00	2026-06-10	122.1792
3452540b-b64a-4c93-967e-69d9b34a55e1	8aec2716-0268-48e6-a3e4-80a542fd7028	98	2026-06-10 00:18:33.271839+00	2026-06-10	110.544
4fc6c649-6b04-432f-abd3-32a709e4ae80	8aec2716-0268-48e6-a3e4-80a542fd7028	102	2026-06-10 00:23:14.469635+00	2026-06-10	152.184
f642d72a-9e67-40b9-8e09-107840f4894c	8aec2716-0268-48e6-a3e4-80a542fd7028	84.2	2026-06-10 00:29:38.000585+00	2026-06-10	85.5472
0cdacdda-f95d-4c5b-8489-a1a70a8e8391	8aec2716-0268-48e6-a3e4-80a542fd7028	95.4	2026-06-10 00:38:16.687171+00	2026-06-10	142.3368
c63010b4-5fad-4ffe-80a2-c9010e881f01	8aec2716-0268-48e6-a3e4-80a542fd7028	93.6	2026-06-10 00:45:03.037784+00	2026-06-10	111.5712
17cae77d-26d1-43a1-bd57-3a89e818b002	8aec2716-0268-48e6-a3e4-80a542fd7028	65.8	2026-06-10 00:50:32.221476+00	2026-06-10	79.7496
a5f759e5-22dd-4115-bae9-af7334d781bd	8aec2716-0268-48e6-a3e4-80a542fd7028	73.1	2026-06-10 00:56:52.531706+00	2026-06-10	142.1064
8c5650de-3fc1-4004-b8aa-9a4f02fd883a	8aec2716-0268-48e6-a3e4-80a542fd7028	88.2	2026-06-10 01:06:52.034253+00	2026-06-10	181.3392
14069baa-9a24-4330-afd4-7c6a927e7361	8aec2716-0268-48e6-a3e4-80a542fd7028	88.5	2026-06-10 03:02:17.043002+00	2026-06-10	89.916
f85f837a-083d-4dc9-b7c1-5232547fbf0a	8aec2716-0268-48e6-a3e4-80a542fd7028	83.4	2026-06-10 15:14:52.547992+00	2026-06-10	134.7744
0da1c2e7-39ce-48ef-92dc-641ddfd0b8f3	8aec2716-0268-48e6-a3e4-80a542fd7028	83.7	2026-06-10 16:11:06.036739+00	2026-06-10	140.2812
9a459d67-413c-46a3-8c81-d2f0e3e44f34	8aec2716-0268-48e6-a3e4-80a542fd7028	85	2026-06-10 16:36:24.418066+00	2026-06-10	121.04
80b65746-b509-4619-8d29-668de8d05617	8aec2716-0268-48e6-a3e4-80a542fd7028	61.3	2026-06-10 16:55:37.151491+00	2026-06-10	84.8392
\.


--
-- Data for Name: english_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."english_progress" ("id", "user_id", "base_line", "main_line", "agincourt", "neo_catalan") FROM stdin;
beb2aa8e-e74a-44a8-bd93-ca53153b2590	8aec2716-0268-48e6-a3e4-80a542fd7028	1. c4	1. c4	1. c4 e6 2. Nf3 d5 3. g3	1. c4 e6 2. Nf3 d5 3. g3 Nf6 4. Bg2 Be7 5. O-O
\.


--
-- Data for Name: french_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."french_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
df542544-4311-4326-8a4f-d0acbee0828b	8aec2716-0268-48e6-a3e4-80a542fd7028	1. e4 e6 2. d4 d5	1. e4 e6 2. d4 d5
\.


--
-- Data for Name: gruenfeld_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."gruenfeld_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
2465fc47-3728-4540-9521-ff04e4841a01	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 Nf6 2. c4 g6 3. Nc3 d5	1. d4 Nf6 2. c4 g6 3. Nc3 d5
\.


--
-- Data for Name: italian_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."italian_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
072c31a4-ee6f-4e61-bcbb-fa085fea7a89	8aec2716-0268-48e6-a3e4-80a542fd7028	1. e4 e5 2. Nf3 Nc6 3. Bc4	1. e4 e5 2. Nf3 Nc6 3. Bc4
\.


--
-- Data for Name: kings_indian_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."kings_indian_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
f9e569df-3c0c-43c5-9076-43c7cf29f758	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 Nf6 2. c4 g6	1. d4 Nf6 2. c4 g6
\.


--
-- Data for Name: opening_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."opening_lines" ("id", "user_id", "opening", "line_key", "moves", "source_line_key", "created_at") FROM stdin;
\.


--
-- Data for Name: petrovs_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."petrovs_progress" ("id", "user_id", "base_line", "main_line", "modern", "paulsen_attack", "classical_karklins_martinovsky", "kaufmann_attack") FROM stdin;
1531659c-c818-4e02-935f-1cc6f8412aa2	8aec2716-0268-48e6-a3e4-80a542fd7028	1. e4 e5 2. Nf3 Nf6	1. e4 e5 2. Nf3 Nf6	1. e4 e5 2. Nf3 Nf6 3. d4 exd4 4. e5 Ne4	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nc4	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nd3	1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. c4
\.


--
-- Data for Name: queens_bishop_game_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."queens_bishop_game_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
31461089-10bf-4f17-9acd-3757674bc2ae	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3	1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3
\.


--
-- Data for Name: queens_gambit_declined_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."queens_gambit_declined_progress" ("id", "user_id", "base_line", "main_line", "charousek", "three_knights", "ragozin_defense", "barmen", "modern", "semi_tarrasch", "semi_slav", "harrwitz_attack") FROM stdin;
0b8bd5aa-3f26-4f4b-ac8a-f3ab26ae217b	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 d5 2. c4	1. d4 d5 2. c4 e7e6	1. d4 d5 2. c4 e6 3. Nc3 Be7	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Bb4	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Nbd7	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 c5	1. d4 d5 2. c4 e6 3. Nf3 Nf6 4. e3 c6 5. Nbd2	1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bf4
\.


--
-- Data for Name: queens_indian_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."queens_indian_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
1f2d2f4b-7866-499f-9cc6-c9d0cf7b51e4	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 Nf6 2. c4 e6 3. Nf3 b6	1. d4 Nf6 2. c4 e6 3. Nf3 b6
\.


--
-- Data for Name: queens_pawn_game_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."queens_pawn_game_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
8a5bb974-6cb2-4731-a27f-a01fbbb39ad7	8aec2716-0268-48e6-a3e4-80a542fd7028	1. d4 d5	1. d4 d5
\.


--
-- Data for Name: reti_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."reti_progress" ("id", "user_id", "base_line", "main_line") FROM stdin;
a33e85e9-0607-44ab-b976-b64f856d756e	8aec2716-0268-48e6-a3e4-80a542fd7028	1. Nf3	1. Nf3
\.


--
-- Data for Name: sicilian_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."sicilian_progress" ("id", "user_id", "base_line", "main_line", "Najdorf", "Najdorf_English_Attack", "Najdorf_Main_Line", "Najdorf_Classical", "Dragon", "Dragon_Yugoslav_Attack", "Dragon_Classical", "Dragon_Fianchetto", "Dragon_Levenfish", "sveshnikov", "Sveshnikov_Main_Line", "scheveningen", "Scheveningen_Keres_Attack", "Scheveningen_English_Attack", "Accelerated_Dragon", "alapin", "Alapin_Barmen_Defense", "Alapin_Main_Line", "Alapin_Nc6", "Rossolimo_Attack", "Rossolimo_Attack_g6", "Rossolimo_Attack_e6", "Rossolimo_Attack_d6", "Rossolimo_Attack_Nf6", "closed", "Closed_e6", "Closed_a6", "Grand_Prix", "Grand_Prix_Accelerated") FROM stdin;
fa55ab60-56e0-4e07-9477-c6dcb059c3d0	8aec2716-0268-48e6-a3e4-80a542fd7028	1. e4 c5	1. e4 c5	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. g3	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. f4	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. g4	1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be3	1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 g6	1. e4 c5 2. c3	1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4	1. e4 c5 2. c3 Nf6	1. e4 c5 2. c3 Nc6 3. d4 cxd4 4. cxd4 d5	1. e4 c5 2. Nf3 Nc6 3. Bb5	1. e4 c5 2. Nf3 Nc6 3. Bb5 g6	1. e4 c5 2. Nf3 Nc6 3. Bb5 e6	1. e4 c5 2. Nf3 Nc6 3. Bb5 d6	1. e4 c5 2. Nf3 Nc6 3. Bb5 Nf6	1. e4 c5 2. Nc3	1. e4 c5 2. Nc3 e6	1. e4 c5 2. Nc3 a6	1. e4 c5 2. Nc3 Nc6 3. f4	1. e4 c5 2. f4 d5
\.


--
-- Data for Name: spanish_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."spanish_progress" ("id", "user_id", "base_line", "main_line", "closed", "berlin", "exchange", "open", "marshall") FROM stdin;
7220da82-f3b3-4623-b9fe-02ac6adbb21c	8aec2716-0268-48e6-a3e4-80a542fd7028	1. e4 e5 2. Nf3 Nc6 3. Bb5	1. e4 e5 2. Nf3 Nc6 3. Bb5	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7	1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4	1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5
\.


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_progress" ("id", "user_id", "level", "unlocked_openings", "beaten_openings", "userMinPly") FROM stdin;
1925c676-265b-467a-8235-838d33629e01	8aec2716-0268-48e6-a3e4-80a542fd7028	3	{None,Random,French,Caro-Kann,Benoni,English,Italian,Catalan}	{None,French}	4
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 164, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict lFUT826KHI0BOb9jEN8QOXwzNAb8YB8UtnSRsBXDTi5vnuEAjuMkyPboJ6B12Zg

RESET ALL;
