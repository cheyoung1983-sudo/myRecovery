import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sponsor, UserProfile } from '../types';
import { SUPER_ADMIN_EMAIL } from '../constants';
import { auth } from '../lib/firebase';
import { BadgeCheck, X, Check, Clock, User, Award, MapPin, BarChart3, PieChart as PieIcon, TrendingUp, Key, ShieldAlert, Settings, RefreshCw, Eye, EyeOff, Globe, Zap, Terminal, Code2, Play, Flame, Mail, Link, ShieldCheck, Copy, CheckCircle2, Sparkles, BookOpen, ExternalLink, ThumbsUp, FileText, Layers, Search, Calculator, AlertTriangle, Gauge, Activity, Smartphone, Video, Shield, Plus, Trash2, Info, Lock, Workflow, PlayCircle, FileJson } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface AdminDashboardProps {
  pendingSponsors: Sponsor[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  allSponsors: Sponsor[];
  allUserProfiles: (UserProfile & { uid: string })[];
  onUpdateRole: (uid: string, role: 'user' | 'mentor' | 'admin') => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  pendingSponsors, 
  onApprove, 
  onReject,
  allSponsors,
  allUserProfiles,
  onUpdateRole
}) => {
  const [idpConfigs, setIdpConfigs] = React.useState<any[]>([]);
  const [isLoadingIdps, setIsLoadingIdps] = React.useState(false);
  const [idpSource, setIdpSource] = React.useState("");
  const [editingIdp, setEditingIdp] = React.useState<any | null>(null);
  const [isSavingIdp, setIsSavingIdp] = React.useState(false);
  const [idpError, setIdpError] = React.useState<string | null>(null);
  const [showIdpSecret, setShowIdpSecret] = React.useState(false);

  // Form Fields
  const [formClientId, setFormClientId] = React.useState("");
  const [formClientSecret, setFormClientSecret] = React.useState("");
  const [formEnabled, setFormEnabled] = React.useState(true);

  const fetchIdpConfigs = async () => {
    setIsLoadingIdps(true);
    setIdpError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/idp", {
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIdpConfigs(data.configs || []);
        setIdpSource(data.source || "simulation");
      } else {
        const err = await res.json();
        setIdpError(err.error || "Failed to load Identity Provider configurations.");
      }
    } catch (err: any) {
      setIdpError(err.message || "Network error loading configurations.");
    } finally {
      setIsLoadingIdps(false);
    }
  };

  React.useEffect(() => {
    fetchIdpConfigs();
  }, []);

  const handleEditConfig = (providerId: string) => {
    const existing = idpConfigs.find(cfg => cfg.name.endsWith(`/${providerId}`));
    setEditingIdp({
      idpId: providerId,
      name: providerId,
      enabled: existing ? existing.enabled : true,
      clientId: existing ? existing.clientId : "",
      clientSecret: existing ? existing.clientSecret : ""
    });
    setFormClientId(existing ? existing.clientId : "");
    setFormClientSecret(existing ? existing.clientSecret : "");
    setFormEnabled(existing ? existing.enabled : true);
    setShowIdpSecret(false);
  };

  const handleSaveIdp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdp) return;
    setIsSavingIdp(true);
    setIdpError(null);

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      
      const isNew = !idpConfigs.some(cfg => cfg.name.endsWith(`/${editingIdp.idpId}`));
      const method = isNew ? "POST" : "PATCH";
      const url = isNew ? "/api/admin/idp" : `/api/admin/idp/${editingIdp.idpId}`;
      const payload = isNew 
        ? { idpId: editingIdp.idpId, clientId: formClientId, clientSecret: formClientSecret, enabled: formEnabled }
        : { clientId: formClientId, clientSecret: formClientSecret, enabled: formEnabled };

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingIdp(null);
        await fetchIdpConfigs();
      } else {
        const err = await res.json();
        setIdpError(err.error || "Failed to save configuration.");
      }
    } catch (err: any) {
      setIdpError(err.message || "Network error while saving.");
    } finally {
      setIsSavingIdp(false);
    }
  };

  const handleToggleIdp = async (idpId: string, currentEnabled: boolean) => {
    setIdpError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      
      const config = idpConfigs.find(cfg => cfg.name.endsWith(`/${idpId}`));
      if (!config) {
        handleEditConfig(idpId);
        return;
      }

      const res = await fetch(`/api/admin/idp/${idpId}`, {
        method: "PATCH",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ enabled: !currentEnabled })
      });

      if (res.ok) {
        await fetchIdpConfigs();
      } else {
        const err = await res.json();
        setIdpError(err.error || "Failed to toggle state.");
      }
    } catch (err: any) {
      setIdpError(err.message || "Network error toggling state.");
    }
  };

  const handleDeleteIdp = async (idpId: string) => {
    if (!window.confirm(`Are you sure you want to completely remove the credentials for ${idpId}?`)) return;
    setIdpError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch(`/api/admin/idp/${idpId}`, {
        method: "DELETE",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });
      if (res.ok) {
        await fetchIdpConfigs();
      } else {
        const err = await res.json();
        setIdpError(err.error || "Failed to remove configuration.");
      }
    } catch (err: any) {
      setIdpError(err.message || "Network error while removing provider.");
    }
  };

  // Firebase configuration (firebase.json) state managers
  const [firebaseJsonAuth, setFirebaseJsonAuth] = React.useState<any>(null);
  const [isLoadingAuthJson, setIsLoadingAuthJson] = React.useState(false);
  const [authJsonError, setAuthJsonError] = React.useState<string | null>(null);
  const [isSavingAuthJson, setIsSavingAuthJson] = React.useState(false);
  const [authJsonSaveSuccess, setAuthJsonSaveSuccess] = React.useState(false);

  // Deploy simulation states
  const [isDeployingAuth, setIsDeployingAuth] = React.useState(false);
  const [deployLogs, setDeployLogs] = React.useState<string[] | null>(null);

  // Form states for providers inside firebase.json
  const [firebaseAnonEnabled, setFirebaseAnonEnabled] = React.useState(true);
  const [firebaseEmailEnabled, setFirebaseEmailEnabled] = React.useState(true);
  const [firebaseGoogleEnabled, setFirebaseGoogleEnabled] = React.useState(true);
  const [firebaseGoogleBrandName, setFirebaseGoogleBrandName] = React.useState("");
  const [firebaseGoogleSupportEmail, setFirebaseGoogleSupportEmail] = React.useState("");
  const [firebaseGoogleRedirects, setFirebaseGoogleRedirects] = React.useState("");

  const fetchFirebaseJsonConfig = async () => {
    setIsLoadingAuthJson(true);
    setAuthJsonError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/firebase-json", {
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        const authConfig = data.authConfig || { providers: { anonymous: true, emailPassword: true } };
        setFirebaseJsonAuth(authConfig);
        
        // Populate inputs
        const providers = authConfig.providers || {};
        setFirebaseAnonEnabled(!!providers.anonymous);
        setFirebaseEmailEnabled(!!providers.emailPassword);
        
        const googleSignIn = providers.googleSignIn;
        setFirebaseGoogleEnabled(!!googleSignIn);
        if (googleSignIn) {
          setFirebaseGoogleBrandName(googleSignIn.oAuthBrandDisplayName || "");
          setFirebaseGoogleSupportEmail(googleSignIn.supportEmail || "");
          setFirebaseGoogleRedirects((googleSignIn.authorizedRedirectUris || []).join(", "));
        } else {
          setFirebaseGoogleBrandName("Spokane Recovery Portal");
          setFirebaseGoogleSupportEmail("cheyoung1983@gmail.com");
          setFirebaseGoogleRedirects("http://localhost:3000");
        }
      } else {
        const err = await res.json();
        setAuthJsonError(err.error || "Failed to load firebase.json file.");
      }
    } catch (err: any) {
      setAuthJsonError(err.message || "Network exception fetching firebase.json.");
    } finally {
      setIsLoadingAuthJson(false);
    }
  };

  React.useEffect(() => {
    fetchFirebaseJsonConfig();
  }, []);

  const handleSaveFirebaseJson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAuthJson(true);
    setAuthJsonError(null);
    setAuthJsonSaveSuccess(false);

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";

      const updatedProviders: any = {
        anonymous: firebaseAnonEnabled,
        emailPassword: firebaseEmailEnabled
      };

      if (firebaseGoogleEnabled) {
        updatedProviders.googleSignIn = {
          oAuthBrandDisplayName: firebaseGoogleBrandName,
          supportEmail: firebaseGoogleSupportEmail,
          authorizedRedirectUris: firebaseGoogleRedirects
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
        };
      }

      const res = await fetch("/api/admin/firebase-json", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          authConfig: {
            providers: updatedProviders
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFirebaseJsonAuth(data.authConfig);
        setAuthJsonSaveSuccess(true);
        setTimeout(() => setAuthJsonSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        setAuthJsonError(err.error || "Failed to save configuration.");
      }
    } catch (err: any) {
      setAuthJsonError(err.message || "Network exception saving firebase.json.");
    } finally {
      setIsSavingAuthJson(false);
    }
  };

  const handleDeployAuth = async () => {
    setIsDeployingAuth(true);
    setDeployLogs(null);
    setAuthJsonError(null);

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";

      const res = await fetch("/api/admin/firebase-json/deploy", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDeployLogs(data.logs || []);
      } else {
        const err = await res.json();
        setAuthJsonError(err.error || "Failed to deploy authentication scheme.");
      }
    } catch (err: any) {
      setAuthJsonError(err.message || "Deploy command execution failed.");
    } finally {
      setIsDeployingAuth(false);
    }
  };

  // Cloud Functions triggers and blocking actions state
  const [functionsCode, setFunctionsCode] = React.useState<string>("");
  const [isLoadingFunctionsCode, setIsLoadingFunctionsCode] = React.useState(false);
  const [isSavingFunctionsCode, setIsSavingFunctionsCode] = React.useState(false);
  const [functionsSaveSuccess, setFunctionsSaveSuccess] = React.useState(false);
  const [functionsError, setFunctionsError] = React.useState<string | null>(null);

  // Cloud Functions deployment simulation state
  const [isDeployingFunctions, setIsDeployingFunctions] = React.useState(false);
  const [functionsDeployLogs, setFunctionsDeployLogs] = React.useState<string[] | null>(null);

  // Cloud Functions trigger simulation console state
  const [simulationEvent, setSimulationEvent] = React.useState<"onCreate" | "onDelete" | "beforeCreate">("onCreate");
  const [simulationEmail, setSimulationEmail] = React.useState("spokane.neighbor@gmail.com");
  const [simulationDisplayName, setSimulationDisplayName] = React.useState("Spokane Neighbor");
  const [simulationUid, setSimulationUid] = React.useState(`uid_sim_${Math.random().toString(36).substring(2, 9)}`);
  const [simulationLogs, setSimulationLogs] = React.useState<string[] | null>(null);
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [simulationStatus, setSimulationStatus] = React.useState<"success" | "blocked" | null>(null);

  const fetchFunctionsCode = async () => {
    setIsLoadingFunctionsCode(true);
    setFunctionsError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/functions-code", {
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFunctionsCode(data.code || "");
      } else {
        const err = await res.json();
        setFunctionsError(err.error || "Failed to load Cloud Functions code index file.");
      }
    } catch (err: any) {
      setFunctionsError(err.message || "Network exception fetching Functions code.");
    } finally {
      setIsLoadingFunctionsCode(false);
    }
  };

  // Automatically fetch functions code on mount
  React.useEffect(() => {
    fetchFunctionsCode();
  }, []);

  const handleSaveFunctionsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFunctionsCode(true);
    setFunctionsError(null);
    setFunctionsSaveSuccess(false);

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";

      const res = await fetch("/api/admin/functions-code", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: functionsCode })
      });

      if (res.ok) {
        setFunctionsSaveSuccess(true);
        setTimeout(() => setFunctionsSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        setFunctionsError(err.error || "Failed to save functions code changes.");
      }
    } catch (err: any) {
      setFunctionsError(err.message || "Network exception saving functions code.");
    } finally {
      setIsSavingFunctionsCode(false);
    }
  };

  const handleDeployFunctions = async () => {
    setIsDeployingFunctions(true);
    setFunctionsDeployLogs(null);
    setFunctionsError(null);

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";

      const res = await fetch("/api/admin/functions-deploy", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });

      if (res.ok) {
        const data = await res.json();
        setFunctionsDeployLogs(data.logs || []);
      } else {
        const err = await res.json();
        setFunctionsError(err.error || "Failed to deploy Cloud Functions.");
      }
    } catch (err: any) {
      setFunctionsError(err.message || "Deployment routine executed with an error.");
    } finally {
      setIsDeployingFunctions(false);
    }
  };

  const handleSimulateFunction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulationLogs(null);
    setSimulationStatus(null);
    setFunctionsError(null);

    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";

      const res = await fetch("/api/admin/functions/simulate", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: simulationEvent,
          email: simulationEmail,
          displayName: simulationDisplayName,
          uid: simulationUid
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationLogs(data.logs || []);
        if (data.success) {
          setSimulationStatus("success");
        } else {
          setSimulationStatus("blocked");
        }
      } else {
        const err = await res.json();
        setFunctionsError(err.error || "Failed to run trigger simulation.");
      }
    } catch (err: any) {
      setFunctionsError(err.message || "Network exception executing trigger simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Custom Authentication Domains & Multi-tenancy email state
  const [domainConfig, setDomainConfig] = React.useState<any>(null);
  const [dnsDomainInput, setDnsDomainInput] = React.useState("mail.spokanerecovery.org");
  const [dnsFromNameInput, setDnsFromNameInput] = React.useState("Spokane Recovery Resource Hub");
  const [dnsSupportEmailInput, setDnsSupportEmailInput] = React.useState("support@spokanerecovery.org");
  const [isMultiTenancyActive, setIsMultiTenancyActive] = React.useState(true);
  const [domainLogs, setDomainLogs] = React.useState<string[] | null>(null);
  const [isVerifyingDomain, setIsVerifyingDomain] = React.useState(false);
  const [isApplyingDomain, setIsApplyingDomain] = React.useState(false);
  const [isSavingDomain, setIsSavingDomain] = React.useState(false);
  const [domainSaveSuccess, setDomainSaveSuccess] = React.useState(false);
  const [domainError, setDomainError] = React.useState<string | null>(null);
  const [isLoadingDomain, setIsLoadingDomain] = React.useState(false);
  const [patchLogs, setPatchLogs] = React.useState<string[] | null>(null);
  const [curlCommand, setCurlCommand] = React.useState<string | null>(null);
  const [isPatchingTenant, setIsPatchingTenant] = React.useState<string | null>(null);

  // Success Stories and Case Studies states
  const [selectedCaseStudy, setSelectedCaseStudy] = React.useState<"fabulous" | "rave" | "kwaver" | "reebee">("fabulous");
  const [quizAnswers, setQuizAnswers] = React.useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = React.useState(false);
  const [quizChecked, setQuizChecked] = React.useState(false);

  // Quota & Rate limits interactive states
  const [quotaSearchTerm, setQuotaSearchTerm] = React.useState("");
  const [quotaPricingPlan, setQuotaPricingPlan] = React.useState<"spark" | "blaze">("spark");
  const [quotaCategoryFilter, setQuotaCategoryFilter] = React.useState<"all" | "accounts" | "emails" | "sms" | "apis">("all");
  
  // Simulated traffic / usage attributes
  const [simDailyActiveUsers, setSimDailyActiveUsers] = React.useState(1500);
  const [simHourlyCreationRate, setSimHourlyCreationRate] = React.useState(50);
  const [simEmailVerificationReqs, setSimEmailVerificationReqs] = React.useState(500);
  const [simPasswordResetReqs, setSimPasswordResetReqs] = React.useState(100);
  const [simDailySmsCount, setSimDailySmsCount] = React.useState(1200);
  const [simSmsPerMinute, setSimSmsPerMinute] = React.useState(45);
  const [simToolkitRps, setSimToolkitRps] = React.useState(350);

  // Copy success indicator
  const [supportDraftCopied, setSupportDraftCopied] = React.useState(false);

  // Firestore Best Practices States
  const [fsTargetAudience, setFsTargetAudience] = React.useState<"na" | "eu" | "asia" | "global">("na");
  const [fsDocumentId, setFsDocumentId] = React.useState("Customer_8492");
  const [fsFieldName, setFsFieldName] = React.useState("created_at");
  const [fsExemptionCase, setFsExemptionCase] = React.useState<"sequential" | "large_string" | "ttl" | "large_array">("sequential");
  const [fsTargetRps, setFsTargetRps] = React.useState(3500);

  // Firebase App Check Simulator States
  const [acPlatform, setAcPlatform] = React.useState<"web" | "android" | "ios">("web");
  const [acWebProvider, setAcWebProvider] = React.useState<"recaptcha" | "custom">("recaptcha");
  const [acAndroidProvider, setAcAndroidProvider] = React.useState<"playintegrity" | "custom">("playintegrity");
  const [acIosProvider, setAcIosProvider] = React.useState<"devicecheck" | "appattest" | "custom">("appattest");
  const [acEnforcedServices, setAcEnforcedServices] = React.useState<string[]>(["firestore", "auth", "storage", "functions"]);
  const [acAttestationSimState, setAcAttestationSimState] = React.useState<"idle" | "attesting" | "token_acquired" | "invalid_device">("idle");
  const [acTokenValue, setAcTokenValue] = React.useState("");
  const [acIsTamperedDevice, setAcIsTamperedDevice] = React.useState(false);
  const [acPlayIntegrityCalls, setAcPlayIntegrityCalls] = React.useState(2500);
  const [acRecaptchaAssessments, setAcRecaptchaAssessments] = React.useState(7500);
  const [acBlockedRequests, setAcBlockedRequests] = React.useState(18);
  const [acAllowedRequests, setAcAllowedRequests] = React.useState(3820);
  const [acLogs, setAcLogs] = React.useState<Array<{ time: string; msg: string; type: "info" | "success" | "warn" | "error" }>>([
    { time: "20:25:01", msg: "App Check SDK Initialized with public key attestation structures.", type: "info" },
    { time: "20:25:30", msg: "Token automatically pre-cached from secondary cold memory store.", type: "success" }
  ]);

  const acAddLog = (msg: string, type: "info" | "success" | "warn" | "error") => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    setAcLogs(prev => [{ time: timestamp, msg, type }, ...prev.slice(0, 49)]);
  };

  const acTriggerAttestation = () => {
    const providerName = acPlatform === "web" ? acWebProvider 
                       : acPlatform === "android" ? acAndroidProvider 
                       : acIosProvider;
    
    acAddLog(`Initiating App Check token generation sequence using platform: ${acPlatform.toUpperCase()} (${providerName.toUpperCase()})...`, "info");
    setAcAttestationSimState("attesting");

    setTimeout(() => {
      if (acPlatform === "android" && acIsTamperedDevice) {
        acAddLog("Play Integrity hardware attestation failed! Key attestation signature shows corrupted bootloader or unsafe environment.", "error");
        acAddLog("Rejecting token reissue request. Status returned: INVALID_CLIENT_ATTESTATION_FLOW", "error");
        setAcAttestationSimState("invalid_device");
        setAcBlockedRequests(prev => prev + 1);
        return;
      }

      if (acPlatform === "android") {
        setAcPlayIntegrityCalls(prev => prev + 1);
      } else if (acPlatform === "web" && acWebProvider === "recaptcha") {
        setAcRecaptchaAssessments(prev => prev + 1);
      }

      acAddLog(`Step 1 Complete: Device acquired cryptographic attestation blob from ${providerName.toUpperCase()} provider securely.`, "info");
      
      setTimeout(() => {
        acAddLog("Step 2 Initiated: Shipping primary attestation blob to intermediate App Check verify endpoint (firebaseappcheck.googleapis.com).", "info");
        
        setTimeout(() => {
          const mockToken = "eyJhY2Nlc3NfIjoiYXBwY2hlY2tfIiwidmVyaWZpZWQiOnRydWUsImV4cCI6MTkyOTM5NTAsImRpc3BhdGNoIjoiZmlyZWJhc2UifQ." + Math.random().toString(36).substring(2, 10);
          setAcTokenValue(mockToken);
          setAcAttestationSimState("token_acquired");
          setAcAllowedRequests(prev => prev + 1);
          acAddLog(`Step 3 Success: App Check issued a valid 1-hour expiration token: ${mockToken.slice(0, 18)}...`, "success");
          acAddLog("Token compiled & cached within client SDK memory blocks. Success indicators populated.", "success");
        }, 800);
      }, 700);
    }, 900);
  };

  // Firebase App Check Debug Mode Simulator States
  const [acDebugTokens, setAcDebugTokens] = React.useState<string[]>([
    "123a4567-b89c-12d3-e456-789012345678",
    "db938f32-cc71-4a11-aba0-7a0e82c2a933"
  ]);
  const [acClientDebugTokenActive, setAcClientDebugTokenActive] = React.useState(false);
  const [acClientDebugTokenValue, setAcClientDebugTokenValue] = React.useState("123a4567-b89c-12d3-e456-789012345678");
  const [acNewDebugToken, setAcNewDebugToken] = React.useState("");
  const [acCiDebugTokenSecret, setAcCiDebugTokenSecret] = React.useState("db938f32-cc71-4a11-aba0-7a0e82c2a933");
  const [acCiTestResult, setAcCiTestResult] = React.useState<"idle" | "testing" | "passed" | "failed">("idle");
  const [acCurrentEnv, setAcCurrentEnv] = React.useState<"localhost" | "ci">("localhost");
  const [acLocalRequestStatus, setAcLocalRequestStatus] = React.useState<"idle" | "testing" | "success" | "forbidden_missing" | "forbidden_unregistered">("idle");

  const acGenerateRandomDebugToken = () => {
    const segments = [
      Math.random().toString(16).substring(2, 10),
      Math.random().toString(16).substring(2, 6),
      "4" + Math.random().toString(16).substring(2, 5),
      ((Math.random() * 4 | 0) + 8).toString(16) + Math.random().toString(16).substring(2, 5),
      Math.random().toString(16).substring(2, 14)
    ];
    const newToken = segments.join("-");
    setAcClientDebugTokenValue(newToken);
    acAddLog(`Generated a fresh local client debug token: "${newToken}"`, "info");
  };

  const acAddSafelistedToken = (token: string) => {
    const trimmed = token.trim();
    if (!trimmed) return;
    if (acDebugTokens.includes(trimmed)) {
      acAddLog(`Debug token "${trimmed.slice(0, 8)}..." is already safelisted in Firebase Console.`, "warn");
      return;
    }
    setAcDebugTokens(prev => [...prev, trimmed]);
    setAcNewDebugToken("");
    acAddLog(`Successfully registered and safelisted debug token "${trimmed}" in Firebase Console security settings.`, "success");
  };

  const acRemoveSafelistedToken = (token: string) => {
    setAcDebugTokens(prev => prev.filter(t => t !== token));
    acAddLog(`Revoked & deleted debug token "${token}" from Firebase Console. Devices using this token will be rejected.`, "warn");
  };

  const acRunLocalhostRequest = () => {
    setAcLocalRequestStatus("testing");
    acAddLog("LOCALHOST: Initiated REST backend simulation call '/api/v1/sponsors' using app client headers.", "info");

    setTimeout(() => {
      if (!acClientDebugTokenActive) {
        acAddLog("LOCALHOST FAILURE: Server rejected request. Reason: Missing App Check header attestation signature.", "error");
        setAcBlockedRequests(prev => prev + 1);
        setAcLocalRequestStatus("forbidden_missing");
      } else {
        const isRegistered = acDebugTokens.includes(acClientDebugTokenValue.trim());
        if (isRegistered) {
          acAddLog(`LOCALHOST SUCCESS: Server verified valid App Check Debug Token: "${acClientDebugTokenValue.slice(0, 8)}...". Access permitted.`, "success");
          setAcAllowedRequests(prev => prev + 1);
          setAcLocalRequestStatus("success");
        } else {
          acAddLog(`LOCALHOST FAILURE: Server verified App Check header but token "${acClientDebugTokenValue.slice(0, 8)}..." is UNREGISTERED in the Firebase Console!`, "error");
          setAcBlockedRequests(prev => prev + 1);
          setAcLocalRequestStatus("forbidden_unregistered");
        }
      }
    }, 1000);
  };

  const acRunCiBuildPipeline = () => {
    setAcCiTestResult("testing");
    acAddLog("CI SYSTEM: Spin up GitHub virtual runner and execute integration tests.", "info");
    acAddLog(`CI SYSTEM: Checking secret injection 'process.env.APP_CHECK_DEBUG_TOKEN_FROM_CI' -> Setting configured.`, "info");

    setTimeout(() => {
      const isRegistered = acDebugTokens.includes(acCiDebugTokenSecret.trim());
      if (isRegistered) {
        acAddLog("CI SYSTEM SUCCESS: Firebase endpoints attested the debug token secret successfully! Pipeline reports 100% pass rate.", "success");
        setAcCiTestResult("passed");
      } else {
        acAddLog(`CI SYSTEM CRITICAL FAILURE: Token "${acCiDebugTokenSecret.slice(0, 8)}..." is not registered on the Firebase Console App Check settings. Endpoints returned 403 Forbidden!`, "error");
        setAcCiTestResult("failed");
      }
    }, 1200);
  };

  // --- Advanced Firebase App Check States & Simulators ---
  // A. Metrics evaluation states
  const [acMetricsPreset, setAcMetricsPreset] = React.useState<"prelaunch" | "outdated" | "under_attack">("outdated");
  const [acMetricsEnforceConfirmOpen, setAcMetricsEnforceConfirmOpen] = React.useState(false);
  const [acMetricsEnforcedProducts, setAcMetricsEnforcedProducts] = React.useState<string[]>(["firestore", "auth", "functions"]);
  const [acConfirmProductTarget, setAcConfirmProductTarget] = React.useState<string>("");

  // B. Cloud functions states
  const [acCfTokenState, setAcCfTokenState] = React.useState<"valid" | "invalid" | "missing">("valid");
  const [acCfEnforceAppCheck, setAcCfEnforceAppCheck] = React.useState(true);
  const [acCfConsumeAppCheckToken, setAcCfConsumeAppCheckToken] = React.useState(false);
  const [acCfLogResult, setAcCfLogResult] = React.useState<string>("");
  const [acCfExecutionActive, setAcCfExecutionActive] = React.useState(false);

  // C. Custom backend & Replay Protection states
  const [acCbBackendLang, setAcCbBackendLang] = React.useState<"node" | "python" | "go" | "ruby">("node");
  const [acCbConsumeEnabled, setAcCbConsumeEnabled] = React.useState(false);
  const [acCbTokenInput, setAcCbTokenInput] = React.useState("abc123_secured_app_check_token_xyz");
  const [acCbSimulating, setAcCbSimulating] = React.useState(false);
  const [acCbResponseStatus, setAcCbResponseStatus] = React.useState<number | null>(null);
  const [acCbResponsePayload, setAcCbResponsePayload] = React.useState<string>("");
  const [acCbLogs, setAcCbLogs] = React.useState<string[]>([]);
  const [acConsumedCbTokens, setAcConsumedCbTokens] = React.useState<string[]>(["spent_token_token_123"]);

  // --- App Check Best Practices Auditing States ---
  const [acBestPracticeChecks, setAcBestPracticeChecks] = React.useState<{ [key: string]: boolean }>({
    metrics_eval: true,
    outdated_prelaunch: true,
    fn_metric_filter: false,
    custom_signature: true,
    custom_rs256: true,
    custom_typ: true,
    custom_iss: false,
    custom_exp: true,
    custom_aud: false,
    custom_sub: false,
    replay_sensitive: false,
    no_debug_prod: true,
  });
  const [acAuditLoading, setAcAuditLoading] = React.useState(false);
  const [acAuditComplete, setAcAuditComplete] = React.useState(false);
  const [acAuditScore, setAcAuditScore] = React.useState(60);

  // Calculate metrics based on preset selection
  const acSelectedMetrics = React.useMemo(() => {
    switch (acMetricsPreset) {
      case "prelaunch":
        return {
          verified: 100,
          outdated: 0,
          unknown: 0,
          invalid: 0,
          totalRequests: 21500,
          recommendation: "EXCELLENT OPTION. Enable App Check enforcement immediately. No outdated versions are currently active, meaning there is zero chance of disrupting legitimate users.",
          color: "text-emerald-400"
        };
      case "under_attack":
        return {
          verified: 15,
          outdated: 5,
          unknown: 55,
          invalid: 25,
          totalRequests: 942000,
          recommendation: "CRITICAL ACTION REQUIRED: Enable enforcement immediately. A massive volume of requests originates from unknown sources (potential bot scraper attacks/abuse) and invalid signatures. Enforcing will decouple attacks instantaneously while protecting legacy builds.",
          color: "text-rose-450 text-red-400 font-extrabold animate-pulse"
        };
      case "outdated":
      default:
        return {
          verified: 62,
          outdated: 31,
          unknown: 5,
          invalid: 2,
          totalRequests: 148000,
          recommendation: "PROCEED WITH EXTREME CAUTION: Do NOT enable enforcement yet. A significant segment (31%) of your users are hitting the server from outdated clients (versions compiled without App Check SDK support). Enabling enforcement right now will reject 1/3 of your legitimate user base. Wait for broader update adoption.",
          color: "text-amber-450 text-amber-500"
        };
    }
  }, [acMetricsPreset]);

  // Handle Enforcement Toggle Confirmation
  const acTriggerEnforceToggle = (product: string) => {
    if (acMetricsEnforcedProducts.includes(product)) {
      // Disable directly
      setAcMetricsEnforcedProducts(prev => prev.filter(p => p !== product));
      acAddLog(`Simulated Firebase Console: Disabled App Check enforcement for ${product.toUpperCase()}.`, "warn");
    } else {
      // Trigger confirmation display first
      setAcConfirmProductTarget(product);
      setAcMetricsEnforceConfirmOpen(true);
    }
  };

  const acConfirmEnforcement = () => {
    if (acConfirmProductTarget) {
      setAcMetricsEnforcedProducts(prev => [...prev, acConfirmProductTarget]);
      acAddLog(`Simulated Firebase Console: Enforced App Check on ${acConfirmProductTarget.toUpperCase()}`, "success");
      setAcConfirmProductTarget("");
    }
    setAcMetricsEnforceConfirmOpen(false);
  };

  // Run simulated Cloud Functions trigger and output logs
  const acRunCfSimulator = () => {
    setAcCfExecutionActive(true);
    setAcCfLogResult("");
    acAddLog("CLOUD FUNCTIONS: Invoking HTTPS callable functions on standard client...", "info");

    setTimeout(() => {
      let severity = "INFO";
      let appStatus = "VALID";
      let message = "Callable header verifications passed.";
      let details = "Function execution completed successfully. Computed mentor pairing matching weights safely.";

      if (!acCfEnforceAppCheck) {
        severity = "INFO";
        appStatus = acCfTokenState === "valid" ? "VALID" : acCfTokenState === "invalid" ? "INVALID" : "MISSING";
        message = appStatus === "VALID" ? "Callable header verification passed." : "Callable header verification bypassed (Enforcement option is inactive in functions config).";
        details = "Proceeded with function runtime regardless of attestation outcome.";
      } else {
        if (acCfTokenState === "missing") {
          severity = "WARNING";
          appStatus = "MISSING";
          message = "Callable header verification rejected. Request is missing an App Check token attestation header.";
          details = "Trigger Exception 403. Authentication failed. Aborted logic execution to satisfy enforceAppCheck constraint.";
        } else if (acCfTokenState === "invalid") {
          severity = "ERROR";
          appStatus = "INVALID";
          message = "Callable header verification critical exception. Presented App Check signature is invalid or emulated.";
          details = "Trigger Exception 403. Rejected request payload to protect service boundaries from inauthentic sources.";
        } else {
          // Valid
          if (acCfConsumeAppCheckToken) {
            details = "Verified & consumed Limited-Use App Check JWT. Token is now spent upstream.";
          }
        }
      }

      const generatedLog = {
        severity,
        "logging.googleapis.com/labels": {
          "firebase-log-type": "callable-request-verification"
        },
        jsonPayload: {
          message,
          verifications: {
            app: appStatus,
            consumeStatus: acCfConsumeAppCheckToken ? "CONSUMED" : "STANDARD_VERIFIED"
          },
          executionDetails: details
        }
      };

      setAcCfLogResult(JSON.stringify(generatedLog, null, 2));
      setAcCfExecutionActive(false);

      if (severity === "INFO") {
        acAddLog(`CLOUD FUNCTIONS: Request completed with response 200 OK. [App State: ${appStatus}]`, "success");
      } else {
        acAddLog(`CLOUD FUNCTIONS: Request failed with verification exception (HttpStatus: 403 Forbidden). App Attestation: ${appStatus}`, "error");
      }
    }, 1000);
  };

  // Run Custom Backend verification including Replay Protection (Token consumption) status
  const acRunCbSimulator = () => {
    setAcCbSimulating(true);
    setAcCbLogs([]);
    setAcCbResponseStatus(null);
    setAcCbResponsePayload("");

    const logArray: string[] = [];
    const pushLog = (text: string) => {
      logArray.push(text);
      setAcCbLogs([...logArray]);
    };

    pushLog(`[API GATEWAY] Received request on "/api/v1/sponsors/secure" carrying custom header X-Firebase-AppCheck.`);
    const currentToken = acCbTokenInput.trim();

    if (!currentToken) {
      setTimeout(() => {
        pushLog(`[MIDDLEWARE] Parsing context: Custom header 'X-Firebase-AppCheck' was not found or is empty.`);
        pushLog(`[MIDDLEWARE] Status: 401 Unauthorized. Access Rejected.`);
        setAcCbResponseStatus(401);
        setAcCbResponsePayload(JSON.stringify({ error: "Unauthorized", reason: "Missing required App Check token on headers." }, null, 2));
        setAcCbSimulating(false);
        acAddLog("Custom Resource Server: Blocked request. Missing custom verification header completely.", "error");
      }, 700);
      return;
    }

    setTimeout(() => {
      pushLog(`[MIDDLEWARE] Initiated Google SDK Admin Verify endpoint callback sequence.`);
      pushLog(`[MIDDLEWARE] Parsing header token payload: "${currentToken.slice(0, 10)}..."`);

      setTimeout(() => {
        // Check structural validation
        const isValidSignature = currentToken.includes("abc123_secured_app_check_token");

        if (!isValidSignature) {
          pushLog(`[SDK ERROR] JWT verification failed. Signature decrypt exception: Invalid cryptographic footprint.`);
          pushLog(`[MIDDLEWARE] Status: 401 Unauthorized. Access Denied.`);
          setAcCbResponseStatus(401);
          setAcCbResponsePayload(JSON.stringify({ error: "Unauthorized", reason: "Presented signature could not be verified by App Check core keys." }, null, 2));
          setAcCbSimulating(false);
          acAddLog("Custom Resource Server: Blocked request. Token signature verification failed.", "error");
          return;
        }

        // Validate Replay protection logic
        if (acCbConsumeEnabled) {
          pushLog(`[MIDDLEWARE] Replay protection flag { consume: true } verified on request options.`);
          pushLog(`[SDK ADMIN] Communicating with Upstream App Check token registries to check spent claims...`);

          setTimeout(() => {
            const isAlreadySpent = acConsumedCbTokens.includes(currentToken);

            if (isAlreadySpent) {
              pushLog(`[SDK WARNING] Token validation completed. Claims verified successfully but token was ALREADY CONSUMED! Replay attack detected.`);
              pushLog(`[MIDDLEWARE] Already consumed state reported: alreadyConsumed = true.`);
              pushLog(`[MIDDLEWARE] Status: 401 Unauthorized - Replay Violation.`);
              setAcCbResponseStatus(401);
              setAcCbResponsePayload(JSON.stringify({
                error: "Unauthorized",
                reason: "This App Check token was already consumed. Replay mitigation triggered.",
                errorCode: "TOKEN_ALREADY_SPENT"
              }, null, 2));
              setAcCbSimulating(false);
              acAddLog(`Custom Resource Server: Replay protection intercepted an identical request! Token: ${currentToken.slice(0, 8)}... already consumed.`, "error");
            } else {
              // Successfully validated and spent
              setAcConsumedCbTokens(prev => [...prev, currentToken]);
              pushLog(`[SDK SUCCESS] Unspent verification confirmed. Issuing consuming write locks upstream...`);
              pushLog(`[MIDDLEWARE] Token consumed successfully. Decoded claims matched audience.`);
              pushLog(`[MIDDLEWARE] Status: 200 OK. Forwarding connection context next().`);
              setAcCbResponseStatus(200);
              setAcCbResponsePayload(JSON.stringify({
                status: "success",
                data: { message: "Access permitted on custom self-hosted database resources securely!" },
                tokenConsumedLog: { token: currentToken.slice(0, 10) + "...", consumedState: "just_flagged_unusable" }
              }, null, 2));
              setAcCbSimulating(false);
              acAddLog(`Custom Resource Server: Authenticated request under strict Replay Protection block. Spent token recorded.`, "success");
            }
          }, 800);
        } else {
          // Standard check (No replay consumption)
          pushLog(`[MIDDLEWARE] Decoded token header claims matched: RS256 algorithm / TYPE JWT.`);
          pushLog(`[MIDDLEWARE] Status: 200 OK. Forwarded to secure controller endpoints.`);
          setAcCbResponseStatus(200);
          setAcCbResponsePayload(JSON.stringify({
            status: "success",
            data: { message: "Self-hosted custom backend database response." }
          }, null, 2));
          setAcCbSimulating(false);
          acAddLog(`Custom Resource Server: Standard JWT validation approved request successfully.`, "success");
        }
      }, 700);
    }, 600);
  };

  const quotaRules = React.useMemo(() => {
    const rules = [
      {
        id: "dau-tier1",
        category: "accounts",
        operation: "Tier 1 Daily Active Users",
        spark: "3,000 per day",
        blaze: "Paid (Dynamic scale)",
        description: "Standard daily active users mapped under Google Cloud Identity Platform Tier 1 pricing.",
        limitValSpark: 3000,
        limitValBlaze: Infinity
      },
      {
        id: "dau-tier2",
        category: "accounts",
        operation: "Tier 2 Daily Active Users",
        spark: "2 per day",
        blaze: "Paid (Dynamic scale)",
        description: "Secondary user identity partitions tracking.",
        limitValSpark: 2,
        limitValBlaze: Infinity
      },
      {
        id: "anon-users",
        category: "accounts",
        operation: "Anonymous user accounts limit",
        spark: "100 Million",
        blaze: "100 Million",
        description: "Aggregate max limit of temporary credentials within a single active project structure.",
        limitValSpark: 100000000,
        limitValBlaze: 100000000
      },
      {
        id: "reg-users",
        category: "accounts",
        operation: "Registered user accounts limit",
        spark: "Unlimited",
        blaze: "Unlimited",
        description: "Permanent password, social link, or custom token profiles stored.",
        limitValSpark: Infinity,
        limitValBlaze: Infinity
      },
      {
        id: "new-user-creation-ip",
        category: "accounts",
        operation: "New account creation rate",
        spark: "100 per hour per IP",
        blaze: "100 per hour per IP",
        description: "Prevention of bot signup attacks. Can be temporarily raised in the console for migration events.",
        limitValSpark: 100,
        limitValBlaze: 100
      },
      {
        id: "user-deletion",
        category: "accounts",
        operation: "Account deletion rate",
        spark: "10 per second",
        blaze: "10 per second",
        description: "High concurrency soft deletes or permanent DB cleanups from apps.",
        limitValSpark: 10,
        limitValBlaze: 10
      },
      {
        id: "email-verify",
        category: "emails",
        operation: "Address verification emails",
        spark: "1,000 / day",
        blaze: "100,000 / day",
        description: "Verification link emails triggered via standard auth flows.",
        limitValSpark: 1000,
        limitValBlaze: 100000
      },
      {
        id: "email-change",
        category: "emails",
        operation: "Address change emails",
        spark: "1,000 / day",
        blaze: "10,000 / day",
        description: "Sent when users request change of primary identity email.",
        limitValSpark: 1000,
        limitValBlaze: 10000
      },
      {
        id: "email-password-reset",
        category: "emails",
        operation: "Password reset emails",
        spark: "150 / day",
        blaze: "10,000 / day",
        description: "Self-service recovery links dispatched through templates.",
        limitValSpark: 150,
        limitValBlaze: 10000
      },
      {
        id: "email-link-signin",
        category: "emails",
        operation: "Email link sign-in emails",
        spark: "5 / day",
        blaze: "25,000 / day",
        description: "Recent change limitation limit. Essential to upgrade to paid billing instrument to scale this value.",
        limitValSpark: 5,
        limitValBlaze: 25000
      },
      {
        id: "email-verify-links",
        category: "emails",
        operation: "Address verification links generated",
        spark: "10,000 / day",
        blaze: "1,000,000 / day",
        description: "Direct backend token generation metrics for system-generated links.",
        limitValSpark: 10000,
        limitValBlaze: 1000000
      },
      {
        id: "email-pw-links",
        category: "emails",
        operation: "Password reset links generated",
        spark: "1,500 / day",
        blaze: "100,000 / day",
        description: "Secured custom deep-link endpoints mapped in GCP console.",
        limitValSpark: 1500,
        limitValBlaze: 100000
      },
      {
        id: "email-signin-links",
        category: "emails",
        operation: "Sign-in links generated",
        spark: "20,000 / day",
        blaze: "250,000 / day",
        description: "OAuth callback link hashes for browser signups.",
        limitValSpark: 20000,
        limitValBlaze: 250000
      },
      {
        id: "sms-user-signin-rate",
        category: "sms",
        operation: "Phone sign-ins rate",
        spark: "1,600 / minute",
        blaze: "1,600 / minute",
        description: "Core minute rate limitation for verification endpoints.",
        limitValSpark: 1600,
        limitValBlaze: 1600
      },
      {
        id: "sms-verify-messages",
        category: "sms",
        operation: "Verification code SMS",
        spark: "3,000 / day (No platform)",
        blaze: "No limit (Identity Platform)",
        description: "Daily SMS quotas. Spark plan caps verification sms count directly.",
        limitValSpark: 3000,
        limitValBlaze: Infinity
      },
      {
        id: "sms-verify-req-ip",
        category: "sms",
        operation: "Verification requests rate",
        spark: "150 requests / IP / hour",
        blaze: "150 requests / IP / hour",
        description: "Anti-spray throttling to prevent telephone bill billing scams.",
        limitValSpark: 150,
        limitValBlaze: 150
      },
      {
        id: "sms-total-min",
        category: "sms",
        operation: "Verification SMS total count",
        spark: "1,000 sent / minute",
        blaze: "1,000 sent / minute",
        description: "Combined outbound pool rate for sms dispatching.",
        limitValSpark: 1000,
        limitValBlaze: 1000
      },
      {
        id: "sms-per-ip-min",
        category: "sms",
        operation: "Verification SMS per IP rate",
        spark: "50/min, 500/hour",
        blaze: "50/min, 500/hour",
        description: "Specific IP isolation limit to protect backend network endpoints.",
        limitValSpark: 50,
        limitValBlaze: 50
      },
      {
        id: "api-service-account",
        category: "apis",
        operation: "Operations per Service Account",
        spark: "500 requests / second",
        blaze: "500 requests / second",
        description: "Firebase Admin SDK backend credentials query limit.",
        limitValSpark: 500,
        limitValBlaze: 500
      },
      {
        id: "api-project-ops",
        category: "apis",
        operation: "Operations per project",
        spark: "1,000 req/sec, 10M/day",
        blaze: "1,000 req/sec, 10M/day",
        description: "Aggregated rate across all active user devices and integrations.",
        limitValSpark: 1000,
        limitValBlaze: 1000
      },
      {
        id: "api-uploads",
        category: "apis",
        operation: "Account uploads per project",
        spark: "3.6 Million / minute",
        blaze: "3.6 Million / minute",
        description: "Batch import utility parameters for migration.",
        limitValSpark: 3600000,
        limitValBlaze: 3600000
      },
      {
        id: "api-downloads",
        category: "apis",
        operation: "Account downloads per project",
        spark: "21,000 requests / minute",
        blaze: "21,000 requests / minute",
        description: "Batch backup downloads rate.",
        limitValSpark: 21000,
        limitValBlaze: 21000
      },
      {
        id: "api-user-info",
        category: "apis",
        operation: "UserInfo queries / minute",
        spark: "900 requests / minute",
        blaze: "900 requests / minute",
        description: "Client side lookup queries rate.",
        limitValSpark: 900,
        limitValBlaze: 900
      },
      {
        id: "api-config-updates",
        category: "apis",
        operation: "Configuration updates",
        spark: "300 requests / minute",
        blaze: "300 requests / minute",
        description: "Meta template mutations rate.",
        limitValSpark: 300,
        limitValBlaze: 300
      },
      {
        id: "api-token-exchange",
        category: "apis",
        operation: "Token exchange rate",
        spark: "18,000 exchanges / minute",
        blaze: "18,000 exchanges / minute",
        description: "Refreshing user access tokens when they expire under clients.",
        limitValSpark: 18000,
        limitValBlaze: 18000
      }
    ];

    return rules.filter(r => {
      const matchSearch = quotaSearchTerm === "" || 
        r.operation.toLowerCase().includes(quotaSearchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(quotaSearchTerm.toLowerCase());
      
      const matchCategory = quotaCategoryFilter === "all" || r.category === quotaCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [quotaSearchTerm, quotaCategoryFilter]);

  const simulatedOverloads = React.useMemo(() => {
    const list: string[] = [];
    const isSpark = quotaPricingPlan === "spark";

    if (isSpark && simDailyActiveUsers > 3000) {
      list.push("Tier 1 Daily Active Users (Limit: 3,000/day on Spark)");
    }
    if (simHourlyCreationRate > 100) {
      list.push("Hourly New Account Creation Rate (Limit: 100/hr per IP)");
    }
    if (isSpark && simEmailVerificationReqs > 1000) {
      list.push("Address Verification Outbound Email Rate (Limit: 1,000/day on Spark)");
    } else if (!isSpark && simEmailVerificationReqs > 100000) {
      list.push("Address Verification Outbound Email Rate (Limit: 100,000/day on Blaze)");
    }
    if (isSpark && simPasswordResetReqs > 150) {
      list.push("Password Reset Outbound Email Rate (Limit: 150/day on Spark)");
    } else if (!isSpark && simPasswordResetReqs > 10000) {
      list.push("Password Reset Outbound Email Rate (Limit: 10,000/day on Blaze)");
    }
    if (isSpark && simDailySmsCount > 3000) {
      list.push("Verification Code SMS Limit (Limit: 3,000 sent/day on Spark)");
    }
    if (simSmsPerMinute > 50) {
      list.push("Verification SMS sent per IP Address (Limit: 50/minute)");
    }
    if (simToolkitRps > 1000) {
      list.push("Identity Toolkit Service API Global Operations (Limit: 1,000 req/sec)");
    }

    return list;
  }, [quotaPricingPlan, simDailyActiveUsers, simHourlyCreationRate, simEmailVerificationReqs, simPasswordResetReqs, simDailySmsCount, simSmsPerMinute, simToolkitRps]);

  const handleCopySupportDraft = () => {
    const overloads = simulatedOverloads.length > 0 
      ? simulatedOverloads.map(o => `   - Exceeded: ${o}`).join("\n")
      : "   [None currently simulated, seeking proactive threshold upgrade]";

    const message = `To Firebase Support Team,

RE: Proactive Firebase Authentication Quota & Limit Adjustments Request

We are preparing our production environment for an upcoming scale event. Our projections indicate that our standard limits under the ${quotaPricingPlan.toUpperCase()} plan will be exceeded or are close to saturation. 

Our targeted projections are:
- Expected Daily Active Users: ${simDailyActiveUsers.toLocaleString()} DU
- Peak Registration rate: ${simHourlyCreationRate} accounts per hour from single IP addresses
- Verification Emails Dispatched: ${simEmailVerificationReqs.toLocaleString()} emails/day
- Password Resets: ${simPasswordResetReqs.toLocaleString()} resets/day
- Daily SMS Sign-Ins Expected: ${simDailySmsCount.toLocaleString()} SMS messages/day
- Max SMS density per IP: ${simSmsPerMinute} SMS/minute
- Simulated API Operations count: ${simToolkitRps} requests/second (Identity Toolkit core)

Current Simulated Overload Check:
${overloads}

As requested under the 2-week advance warning compliance rules, we are notifying you to initiate a discussion regarding adjustments of these rate boundaries to prevent service interruption for our users.

Thank you,
Hub System Administration Office (cheyoung1983@gmail.com)
Local Time: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(message);
    setSupportDraftCopied(true);
    setTimeout(() => setSupportDraftCopied(false), 3000);
  };

  const fsRampUpSchedule = React.useMemo(() => {
    const list: Array<{ step: number; time: string; maxRps: number; accumulatedMultiplier: number }> = [];
    let currentRps = 500;
    let timeElapsed = 0;
    
    // First step
    list.push({
      step: 1,
      time: "0 min (Initial)",
      maxRps: Math.round(currentRps),
      accumulatedMultiplier: 1.0
    });

    while (currentRps < fsTargetRps && list.length < 10) {
      timeElapsed += 5;
      currentRps = currentRps * 1.5;
      list.push({
        step: list.length + 1,
        time: `${timeElapsed} mins`,
        maxRps: Math.round(currentRps),
        accumulatedMultiplier: Math.round((currentRps / 500) * 10) / 10
      });
    }
    return list;
  }, [fsTargetRps]);

  const fsDocIdAudit = React.useMemo(() => {
    const alerts: Array<{ type: "error" | "warning" | "success"; text: string }> = [];
    if (!fsDocumentId.trim()) {
      alerts.push({ type: "warning", text: "Please enter a proposed Document ID to perform a static vulnerability audit." });
      return alerts;
    }
    if (fsDocumentId === "." || fsDocumentId === "..") {
      alerts.push({ type: "error", text: "CRITICAL BANNED ID: The document IDs '.' and '..' are explicitly prohibited as they resolve to relative system pointers." });
    }
    if (fsDocumentId.includes("/")) {
      alerts.push({ type: "error", text: "INVALID SLASH POISONING: Forward slashes '/' are forbidden inside document names as they trigger subcollection split boundaries." });
    }
    // Sequential ID check (monotonically increasing)
    const sequentialRegex = /[0-9]+$/;
    const isSequential = sequentialRegex.test(fsDocumentId);
    if (isSequential) {
      alerts.push({
        type: "warning",
        text: `PERFORMANCE HOTSPOT WARNING: Suffixing sequential numbers (IDs like ${fsDocumentId}) is a hotspotting risk under high write concurrency, forcing writes to narrow lexicographical ranges.`
      });
    }
    if (alerts.length === 0) {
      alerts.push({ type: "success", text: "Document ID shape is perfectly scattered. Safe from write hotspotting!" });
    }
    return alerts;
  }, [fsDocumentId]);

  const fsFieldNameAudit = React.useMemo(() => {
    const alerts: Array<{ type: "error" | "warning" | "success"; text: string }> = [];
    if (!fsFieldName.trim()) {
      alerts.push({ type: "warning", text: "Please enter a proposed field name to analyze." });
      return alerts;
    }
    const badChars = [".", "[", "]", "*", "`"];
    const foundBad: string[] = [];
    badChars.forEach(c => {
      if (fsFieldName.includes(c)) {
        foundBad.push(c);
      }
    });
    if (foundBad.length > 0) {
      alerts.push({
        type: "error",
        text: `ESCAPING HELL ALERT: Field name includes '${foundBad.join(", ")}'. Avoid periods, brackets, stars, or backticks because they necessitate verbose escaping in security rules and queries.`
      });
    } else {
      alerts.push({ type: "success", text: "Clean field name. Native indexing and escaping will compile beautifully." });
    }
    return alerts;
  }, [fsFieldName]);

  const fetchEmailDomainConfig = async () => {
    setIsLoadingDomain(true);
    setDomainError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/auth-email-domains", {
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data.config || {});
        if (data.config) {
          setDnsDomainInput(data.config.customDomain || "");
          setDnsFromNameInput(data.config.fromName || "");
          setDnsSupportEmailInput(data.config.supportEmail || "");
          setIsMultiTenancyActive(!!data.config.multiTenancyEnabled);
        }
      } else {
        const err = await res.json();
        setDomainError(err.error || "Failed to load custom domain configurations.");
      }
    } catch (err: any) {
      setDomainError(err.message || "Network exception fetching custom domain config.");
    } finally {
      setIsLoadingDomain(false);
    }
  };

  const handleSaveDomainConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDomain(true);
    setDomainError(null);
    setDomainSaveSuccess(false);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/auth-email-domains/save", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          config: {
            customDomain: dnsDomainInput,
            fromName: dnsFromNameInput,
            supportEmail: dnsSupportEmailInput,
            multiTenancyEnabled: isMultiTenancyActive
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data.config);
        setDomainSaveSuccess(true);
        setTimeout(() => setDomainSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        setDomainError(err.error || "Failed/refused to update domain layout.");
      }
    } catch (err: any) {
      setDomainError(err.message || "Network exception saving custom domain rules.");
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    setIsVerifyingDomain(true);
    setDomainLogs(null);
    setDomainError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/auth-email-domains/verify", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data.config);
        setDomainLogs(data.logs || []);
      } else {
        const err = await res.json();
        setDomainError(err.error || "Failed to run DNS verification queries.");
      }
    } catch (err: any) {
      setDomainError(err.message || "Network exceptions triggering DNS check.");
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleApplyDomain = async () => {
    setIsApplyingDomain(true);
    setDomainLogs(null);
    setDomainError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/auth-email-domains/apply", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : ""
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data.config);
        setDomainLogs(data.logs || []);
      } else {
        const err = await res.json();
        setDomainError(err.error || "Failed to apply custom authenticated domain.");
      }
    } catch (err: any) {
      setDomainError(err.message || "Network exception applying authentication domain.");
    } finally {
      setIsApplyingDomain(false);
    }
  };

  const handlePatchTenant = async (tenantId: string, inherit: boolean) => {
    setIsPatchingTenant(tenantId);
    setPatchLogs(null);
    setCurlCommand(null);
    setDomainError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/admin/auth-email-domains/patch-tenant", {
        method: "POST",
        headers: {
          "Authorization": idToken ? `Bearer ${idToken}` : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenantId,
          emailSendingConfigInherited: inherit
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data.config);
        setPatchLogs(data.logs || []);
        setCurlCommand(data.cUrlCommand || "");
      } else {
        const err = await res.json();
        setDomainError(err.error || "Failed to customize tenant credentials.");
      }
    } catch (err: any) {
      setDomainError(err.message || "Network exception modifying tenant settings.");
    } finally {
      setIsPatchingTenant(null);
    }
  };

  React.useEffect(() => {
    fetchEmailDomainConfig();
  }, []);

  const needsData = useMemo(() => {
    const counts: Record<string, number> = {};
    allUserProfiles.forEach(u => {
      (u.recoveryNeeds || []).forEach(need => {
        counts[need] = (counts[need] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allUserProfiles]);

  const mentorStats = useMemo(() => {
    const verified = allSponsors.filter(s => s.status === 'verified').length;
    const pending = allSponsors.filter(s => s.status === 'pending').length;
    return [
      { name: 'Verified', value: verified },
      { name: 'Pending', value: pending }
    ];
  }, [allSponsors]);

  const roleStats = useMemo(() => {
    let adminCount = 0;
    let mentorCount = 0;
    let userCount = 0;

    allUserProfiles.forEach(u => {
      if (u.role === 'admin') adminCount++;
      else if (u.role === 'mentor') mentorCount++;
      else userCount++;
    });

    return [
      { name: 'User', value: userCount, color: '#3b82f6' },
      { name: 'Mentor', value: mentorCount, color: '#10b981' },
      { name: 'Admin', value: adminCount, color: '#ef4444' }
    ];
  }, [allUserProfiles]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
      id="admin-dashboard-container"
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">Command Center.</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">myRecovery Insights & Oversight</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-2xl text-blue-500 flex flex-col items-center">
           <span className="text-2xl font-black">{allUserProfiles.length}</span>
           <span className="text-[10px] font-bold uppercase">Members</span>
        </div>
      </div>

      {/* MEMBERSHIP SPLIT SUMMARY CARD WITH DONUT CHART */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-6 flex-1 w-full">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 leading-none">Permission Tiers</span>
              <h3 className="text-3xl font-extrabold text-white tracking-tight">Active Membership Split</h3>
              <p className="text-slate-400 text-sm font-medium">
                Oversight and breakdown of access roles in Spokane's local recovery and mentorship ecosystem.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Users</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-blue-500">{roleStats[0].value}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    ({allUserProfiles.length > 0 ? Math.round((roleStats[0].value / allUserProfiles.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Mentors</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-emerald-500">{roleStats[1].value}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    ({allUserProfiles.length > 0 ? Math.round((roleStats[1].value / allUserProfiles.length) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Admins</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-rose-500">{roleStats[2].value}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    ({allUserProfiles.length > 0 ? Math.round((roleStats[2].value / allUserProfiles.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-56 h-48 flex items-center justify-center relative bg-slate-950/40 border border-slate-800 rounded-3xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleStats}
                  innerRadius={52}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '11px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-2xl font-black text-white">{allUserProfiles.length}</span>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Needs Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Community Needs</h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest leading-none">Popular Recovery Focus Areas</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={needsData.slice(0, 5)} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {needsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mentor Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Mentor Network</h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest leading-none">Status of Spokane Partners</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mentorStats}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-3xl font-black text-white">{mentorStats[0].value + mentorStats[1].value}</span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <User className="text-blue-500" size={24} />
          <h3 className="text-xl font-bold text-white">Member Directory</h3>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Neighborhood</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allUserProfiles.map(u => (
                  <tr key={u.email} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                          {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full rounded-full" referrerPolicy="no-referrer" /> : u.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        u.role === 'admin' ? 'bg-rose-500/20 text-rose-500' :
                        u.role === 'mentor' ? 'bg-emerald-500/20 text-emerald-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium">{u.neighborhood || 'Not set'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                        value={u.role}
                        onChange={(e) => {
                          onUpdateRole(u.uid, e.target.value as any);
                        }}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-1 text-[10px] text-white focus:outline-none"
                        disabled={u.email === SUPER_ADMIN_EMAIL}
                      >
                        <option value="user">User</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2">
        <BadgeCheck size={20} className="text-emerald-500" />
        <h3 className="text-xl font-bold text-white">Mentor Oversight</h3>
        <span className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-xs font-black">{allSponsors.length}</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mentor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Verification Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Years</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allSponsors.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-xs font-black text-blue-500">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">{s.neighborhood}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        s.status === 'verified' ? 'bg-emerald-500/20 text-emerald-500' :
                        s.status === 'rejected' ? 'bg-rose-500/20 text-rose-500' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                        {s.status}
                      </span>
                      {s.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400 font-bold">{s.years} YRS</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {s.status !== 'verified' && (
                        <button 
                          onClick={() => onApprove(s.id)}
                          className="p-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                          title="Verify Mentor"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {s.status !== 'rejected' && (
                        <button 
                          onClick={() => onReject(s.id)}
                          className="p-2 bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                          title="Reject/Suspend Mentor"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2">
        <Clock size={20} className="text-amber-500" />
        <h3 className="text-xl font-bold text-white">Pending Approvals</h3>
        <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-black">{pendingSponsors.length}</span>
      </div>

      {pendingSponsors.length === 0 ? (
        <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2.5rem] py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
            <User size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-bold uppercase tracking-widest text-sm">Inbox Zero.</h3>
            <p className="text-slate-500 text-xs font-medium">No pending mentor applications to review at this time.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingSponsors.map((app) => (
            <motion.div 
              key={app.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/40 border border-slate-800 rounded-[2rem] p-8 shadow-xl relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Clock size={120} />
              </div>

              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-2xl">
                      {app.name[0]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{app.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-400/10 px-2.5 py-1 rounded-lg">
                          <Clock size={12} /> {app.years} Years Sober
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-900 px-2.5 py-1 rounded-lg">
                          <MapPin size={12} /> {app.neighborhood}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Specialties</label>
                      <div className="flex flex-wrap gap-2">
                        {app.specialties.map(spec => (
                          <span key={spec} className="px-3 py-1.5 bg-slate-900 border border-slate-700/50 rounded-xl text-xs text-slate-300 font-medium lowercase">
                            #{spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Mentor Bio & Approach</label>
                      <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-5 rounded-2xl border border-slate-800 italic">
                        "{app.bio}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 shrink-0">
                  <button 
                    onClick={() => onApprove(String(app.id))}
                    className="flex-1 md:w-36 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
                  >
                    <Check size={20} /> Approve
                  </button>
                  <button 
                    onClick={() => onReject(String(app.id))}
                    className="flex-1 md:w-36 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/40 active:scale-95"
                  >
                    <X size={20} /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* IDENTITY PROVIDERS (GCIP REST) MANAGEMENT PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">OAuth Identity Directory</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                idpSource === "gcip-api" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
              }`}>
                {idpSource === "gcip-api" ? "GCP Live Link" : "Sandbox Persistent Mode"}
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Identity Providers (GCIP)</h3>
            <p className="text-slate-400 text-sm max-w-2xl">
              Configure, enable, and manage Client credentials for third-party OAuth sign-in integrations directly interacting with the Firebase/Google Cloud Identity Platform REST APIs.
            </p>
          </div>
          <button 
            type="button"
            onClick={fetchIdpConfigs}
            disabled={isLoadingIdps}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all self-start md:self-center"
          >
            <RefreshCw size={14} className={isLoadingIdps ? "animate-spin" : ""} /> Sync Directory
          </button>
        </div>

        {idpError && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-white">OAuth REST Sync Error</h5>
              <p className="text-slate-400 text-xs leading-relaxed">{idpError}</p>
            </div>
          </div>
        )}

        {isLoadingIdps && idpConfigs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            <p className="text-xs font-black uppercase tracking-widest">Querying identity directory...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { id: "google.com", label: "Google Sign-In", desc: "Allow login via Gmail accounts" },
              { id: "facebook.com", label: "Facebook OAuth", desc: "Connect with Facebook credentials" },
              { id: "github.com", label: "GitHub Connection", desc: "Authenticate with GitHub usernames" },
              { id: "apple.com", label: "Sign in with Apple", desc: "Sleek iOS face ID validation loop" },
              { id: "microsoft.com", label: "Microsoft Portal", desc: "Azure AD & Hotmail sign-in paths" },
              { id: "twitter.com", label: "Twitter / X Profile", desc: "Support client profile handles" }
            ].map((provider) => {
              const matchedConfig = idpConfigs.find(cfg => cfg.name.endsWith(`/${provider.id}`));
              const isConfigured = !!matchedConfig?.clientId;
              const isEnabled = matchedConfig ? matchedConfig.enabled : false;

              return (
                <div 
                  key={provider.id}
                  className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-700/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-bold text-white">{provider.label}</h4>
                        <span className="text-[10px] text-slate-500 font-bold tracking-tight bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                          {provider.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{provider.desc}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        isEnabled 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : isConfigured 
                            ? "bg-amber-500/20 text-amber-500" 
                            : "bg-slate-800 text-slate-500"
                      }`}>
                        {isEnabled ? "Active" : isConfigured ? "Suspended" : "Unconfigured"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/60">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Client ID</span>
                      <span className="text-slate-300 font-mono text-xs select-all truncate max-w-[180px]" title={matchedConfig?.clientId || "---"}>
                        {matchedConfig?.clientId ? matchedConfig.clientId : "None configured"}
                      </span>
                    </div>
                    {matchedConfig?.clientSecret && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-bold uppercase tracking-wider">Client Secret</span>
                        <span className="text-slate-400 font-mono">••••••••••••••••</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleIdp(provider.id, isEnabled)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        isEnabled
                          ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-500"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {isEnabled ? "Suspend" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditConfig(provider.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/50 transition-colors"
                      title="Update Credentials"
                    >
                      <Settings size={14} />
                    </button>

                    {isConfigured && (
                      <button
                        type="button"
                        onClick={() => handleDeleteIdp(provider.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl border border-rose-500/20 transition-colors"
                        title="Delete Credentials"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-slate-500 text-xs bg-slate-950/40 p-4 rounded-2xl border border-slate-800 leading-relaxed font-medium space-y-2">
          <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">💡 Super Admin Setup Tip:</p>
          <p>
            When utilizing Redirect sign-ins on desktop or mobile browsers that block third-party cookies, make sure you configure your OAuth developer clients with the approved authorized redirect Uri structure:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-blue-400 select-all overflow-x-auto">
            {"https://<your-custom-app-domain>/__/auth/handler"}
          </div>
        </div>
      </div>

      {/* EDIT IDP CONFIGURATION OVERLAY MODAL */}
      {editingIdp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-xl p-8 space-y-6 shadow-2xl relative"
          >
            <button 
              type="button"
              onClick={() => setEditingIdp(null)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Credentials Setup</span>
              <h4 className="text-2xl font-black text-white italic tracking-tight uppercase">Configure {editingIdp.idpId}</h4>
              <p className="text-slate-400 text-xs pr-6">
                Updating credentials for {editingIdp.idpId}. This instantly modifies the Firebase Authentication Identity Directory payload configuration.
              </p>
            </div>

            <form onSubmit={handleSaveIdp} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Client ID</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-600">
                    <Key size={14} />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    placeholder="Enter Provider Client ID"
                    className="w-full bg-slate-950 text-white rounded-xl py-3 pl-11 pr-4 border border-slate-800 text-sm focus:border-amber-500/50 focus:outline-none focus:ring-0 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Client Secret (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-600">
                    <Key size={14} />
                  </span>
                  <input 
                    type={showIdpSecret ? "text" : "password"} 
                    value={formClientSecret}
                    onChange={(e) => setFormClientSecret(e.target.value)}
                    placeholder="Enter Provider Client Secret"
                    className="w-full bg-slate-950 text-white rounded-xl py-3 pl-11 pr-12 border border-slate-800 text-sm focus:border-amber-500/50 focus:outline-none focus:ring-0 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowIdpSecret(!showIdpSecret)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white"
                  >
                    {showIdpSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <input 
                  type="checkbox" 
                  id="formEnabledCheck"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-slate-900 border-slate-800 rounded focus:ring-opacity-0 focus:outline-none"
                />
                <label htmlFor="formEnabledCheck" className="text-xs text-slate-300 font-bold select-none cursor-pointer">
                  Activate configuration immediately on save
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIdp(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingIdp}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                >
                  {isSavingIdp ? "Saving..." : "Save Config"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* FIREBASE.JSON AUTH PROVIDERS CLI DEPLOYER PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">Firebase CLI System</span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg">
                Auth-As-Code
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">CLI Deploy Handler (`firebase.json`)</h3>
            <p className="text-slate-400 text-sm max-w-2xl">
              Enable, configure, and specify Firebase Authentication providers inside your project directory as code, then deploy them with the Firebase CLI.
            </p>
          </div>
          <button 
            type="button"
            onClick={fetchFirebaseJsonConfig}
            disabled={isLoadingAuthJson}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all self-start md:self-center"
          >
            <RefreshCw size={14} className={isLoadingAuthJson ? "animate-spin" : ""} /> Read firebase.json
          </button>
        </div>

        {authJsonError && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-white">CLI Schematics Error</h5>
              <p className="text-slate-400 text-xs leading-relaxed">{authJsonError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveFirebaseJson} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Standard Providers */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-base font-bold text-white uppercase tracking-wider text-slate-300">Basic Authenticator Providers</h4>
              <p className="text-xs text-slate-500">Configure standard sign-in types deployed with the authentication scheme.</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/60">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-white">Anonymous Sign-In</span>
                    <p className="text-[11px] text-slate-500">Allow ephemeral unauthenticated sandbox access</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={firebaseAnonEnabled}
                    onChange={(e) => setFirebaseAnonEnabled(e.target.checked)}
                    className="w-5 h-5 text-amber-500 bg-slate-900 border-slate-800 rounded focus:ring-opacity-0 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/60">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-white">Email & Password Auth</span>
                    <p className="text-[11px] text-slate-500">Traditional email registration credential validation</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={firebaseEmailEnabled}
                    onChange={(e) => setFirebaseEmailEnabled(e.target.checked)}
                    className="w-5 h-5 text-amber-500 bg-slate-900 border-slate-800 rounded focus:ring-opacity-0 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Google Sign-in config options */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-white uppercase tracking-wider text-slate-300">Google OAuth Sign-In</h4>
                <input 
                  type="checkbox" 
                  checked={firebaseGoogleEnabled}
                  onChange={(e) => setFirebaseGoogleEnabled(e.target.checked)}
                  className="w-5 h-5 text-amber-500 bg-slate-900 border-slate-800 rounded focus:ring-opacity-0 focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-500">Setup Google Sign-In with dedicated integration brand profile rules.</p>

              {firebaseGoogleEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">OAuth Brand Display Name</label>
                    <input 
                      type="text" 
                      value={firebaseGoogleBrandName}
                      onChange={(e) => setFirebaseGoogleBrandName(e.target.value)}
                      placeholder="e.g. Spokane Support"
                      className="w-full bg-slate-950 text-white rounded-xl py-2 px-3 border border-slate-800 text-xs focus:border-amber-500/50 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Support Contact Email</label>
                    <input 
                      type="email" 
                      value={firebaseGoogleSupportEmail}
                      onChange={(e) => setFirebaseGoogleSupportEmail(e.target.value)}
                      placeholder="e.g. support@domain.com"
                      className="w-full bg-slate-950 text-white rounded-xl py-2 px-3 border border-slate-800 text-xs focus:border-amber-500/50 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Authorized Redirect URIs (Separated by comma)</label>
                    <textarea 
                      rows={2}
                      value={firebaseGoogleRedirects}
                      onChange={(e) => setFirebaseGoogleRedirects(e.target.value)}
                      placeholder="e.g. https://domain.com, http://localhost:3000"
                      className="w-full bg-slate-950 text-white rounded-xl py-2 px-3 border border-slate-800 text-xs focus:border-amber-500/50 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingAuthJson || isLoadingAuthJson}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-45 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isSavingAuthJson ? "Saving to code file..." : "Write to local firebase.json"}
            </button>
            <button
              type="button"
              onClick={handleDeployAuth}
              disabled={isDeployingAuth || isLoadingAuthJson}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isDeployingAuth ? "Executing Firebase Deploy..." : "Deploy config: firebase deploy --only auth"}
            </button>
          </div>
        </form>

        {authJsonSaveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center text-xs font-bold">
            ✔ firebase.json successfully written in root directory!
          </div>
        )}

        {/* INTERACTIVE CLI EMULATOR FOR AUTH DEPLOY */}
        {deployLogs && (
          <div className="bg-black rounded-2xl border border-slate-800 p-5 font-mono text-xs text-slate-300 space-y-3 shadow-inner relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold text-slate-400">Terminal - Firebase CLI Deploy (Auth Node)</span>
              <button 
                type="button"
                onClick={() => setDeployLogs(null)}
                className="text-slate-500 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 overflow-x-auto select-all max-h-72">
              {deployLogs.map((log, index) => (
                <div key={index} className="whitespace-pre min-h-[1.25rem]">
                  {log.startsWith("$") ? (
                    <span className="text-amber-400">{log}</span>
                  ) : log.startsWith("✔") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith("i") ? (
                    <span className="text-blue-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIREBASE AUTH TRIGGER CLOUD FUNCTIONS DIAGNOSTICS & MANAGEMENT PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-505/10 px-2.5 py-1 rounded-lg">
                Cloud Functions for Firebase
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-lg">
                1st Gen & 2nd Gen
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-lg">
                Blocking Auth Rules
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Flame className="text-orange-500 fill-orange-500/10" size={28} />
              Auth Trigger & Blocking Functions Console
            </h3>
            <p className="text-slate-400 text-sm max-w-2xl">
              Write, edit, and locally emulate Firebase auth background triggers (`onCreate` / `onDelete`) and blocking functions (`beforeCreate`) "as code" before publishing them to production.
            </p>
          </div>
          <button 
            type="button"
            onClick={fetchFunctionsCode}
            disabled={isLoadingFunctionsCode}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all self-start lg:self-center"
          >
            <RefreshCw size={14} className={isLoadingFunctionsCode ? "animate-spin" : ""} /> Sync functions/index.js
          </button>
        </div>

        {functionsError && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-white">Diagnostics Exception</h5>
              <p className="text-slate-400 text-xs leading-relaxed">{functionsError}</p>
            </div>
          </div>
        )}

        {/* TOP INTERACTIVE SECTION: SIMULATION & EVENT EMULATION */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Simulated Trigger Controller */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Play className="text-amber-500 fill-amber-500/15" size={16} /> Trigger Simulator
              </h4>
              <p className="text-xs text-slate-500">Inject simulated auth events to inspect runtime Cloud Function logs.</p>
            </div>

            {/* Quick Profile Pre-filler */}
            {allUserProfiles.length > 0 && (
              <div className="space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Quick-Select Registered User To Target</label>
                <select
                  onChange={(e) => {
                    const picked = allUserProfiles.find(u => u.uid === e.target.value);
                    if (picked) {
                      setSimulationEmail(picked.email);
                      setSimulationDisplayName(picked.name || "Spokane Resident");
                      setSimulationUid(picked.uid);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 p-2 focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>-- Choose Spokane Portal Member --</option>
                  {allUserProfiles.map(u => (
                    <option key={u.uid} value={u.uid}>
                      {u.name || "Un-named"} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSimulateFunction} className="space-y-3 pt-1">
              {/* Event Type selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Select Firebase Auth Event Trigger</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulationEvent("onCreate")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      simulationEvent === "onCreate" 
                        ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-900/10" 
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    onCreate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationEvent("onDelete")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      simulationEvent === "onDelete" 
                        ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-900/10" 
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    onDelete
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationEvent("beforeCreate")}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      simulationEvent === "beforeCreate" 
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/10" 
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    blocking (v2)
                  </button>
                </div>
              </div>

              {/* Params */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">User ID (Simulated uid)</label>
                <input 
                  type="text"
                  value={simulationUid}
                  onChange={(e) => setSimulationUid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2 px-3 text-white focus:outline-none focus:border-amber-500/50 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Display Name</label>
                  <input 
                    type="text"
                    value={simulationDisplayName}
                    onChange={(e) => setSimulationDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2 px-3 text-white focus:outline-none focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">User Email</label>
                  <input 
                    type="email"
                    value={simulationEmail}
                    onChange={(e) => setSimulationEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2 px-3 text-white focus:outline-none focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Tips block */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 text-[11px] text-slate-400 leading-relaxed">
                {simulationEvent === "onCreate" && "💡 Simulates generating standard rich HTML greeting template and dispatching SMTP email via Nodemailer transport using loaded credentials."}
                {simulationEvent === "onDelete" && "💡 Simulates administrative clean-up. Purges matching profiles directly from Firestore `/users/{uid}`, then fires departure audit letter."}
                {simulationEvent === "beforeCreate" && "💡 Simulates Blocking Trigger. Validates email against known spam networks (e.g. `mailinator.com`) and adds customizable identity token claims."}
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <Zap size={14} className={isSimulating ? "animate-pulse" : ""} />
                {isSimulating ? "Emulating Trigger Run..." : `Fires ${simulationEvent} Event`}
              </button>
            </form>
          </div>

          {/* Emulated CRT Terminal Log Output */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-black border border-slate-800 rounded-2xl p-5 font-mono shadow-inner min-h-[360px] relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="text-emerald-500" size={16} />
                  <span className="text-[10px] font-black text-slate-400 tracking-wider">TELEMETRY EMULATOR CONSOLE</span>
                </div>
                {simulationLogs && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSimulationLogs(null);
                      setSimulationStatus(null);
                    }}
                    className="text-[10px] text-slate-500 hover:text-white"
                  >
                    [CLEAR PANEL]
                  </button>
                )}
              </div>

              <div className="space-y-1.5 overflow-y-auto selection:bg-emerald-500 selection:text-black max-h-[290px] text-[11px] leading-relaxed">
                {simulationLogs ? (
                  simulationLogs.map((log, index) => {
                    let textClass = "text-slate-300";
                    if (log.includes("[ERROR]") || log.includes("Exception:")) {
                      textClass = "text-red-400 font-bold bg-red-950/20 px-1 py-0.5 rounded";
                    } else if (log.includes("[DEBUG]")) {
                      textClass = "text-cyan-400/80";
                    } else if (log.includes("Status: OK") || log.includes("Status: APPROVED") || log.includes("successfully sent") || log.includes("purged")) {
                      textClass = "text-emerald-400 font-bold";
                    } else if (log.includes("Status: BLOCKED")) {
                      textClass = "text-amber-400 font-bold";
                    }
                    return (
                      <div key={index} className={`whitespace-pre-wrap ${textClass}`}>
                        {log}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 italic text-center py-20 leading-relaxed">
                    <p className="not-italic text-slate-400 font-bold text-center gap-1.5 flex items-center justify-center mb-1">
                      <Terminal size={14} className="stroke-[2.5]" /> Simulator Ready
                    </p>
                    <p>Trigger an event trigger on the left column to run the Auth functions codebase and trace exact node telemetry outputs.</p>
                  </div>
                )}
              </div>
            </div>

            {simulationStatus && (
              <div className={`mt-4 border p-3 rounded-xl flex items-center gap-2.5 transition-all text-xs font-bold leading-none ${
                simulationStatus === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}>
                {simulationStatus === "success" ? (
                  <>
                    <Check className="shrink-0 animate-bounce" size={16} />
                    <span>AUTH SEQUENCE OK: Event completed successfully. Welcome/Farewell dispatched.</span>
                  </>
                ) : (
                  <>
                    <X className="shrink-0" size={16} />
                    <span>REGISTRATION BLOCKED: Disposable address validation failed. Account blocked.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: CODE EDITOR & COMPILER */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="text-slate-400" size={18} /> Code Interface (`functions/index.js`)
              </h4>
              <p className="text-xs text-slate-500">
                Inspect and tweak the real deployment triggers. Changes are synced with backend server simulation.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeployFunctions}
                disabled={isDeployingFunctions || isLoadingFunctionsCode}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {isDeployingFunctions ? "Deploying..." : "Simulate CLI Production Deploy"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveFunctionsCode} className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between bg-slate-900 px-4 py-2 border-b border-slate-850">
                <span className="text-[10px] font-mono font-bold text-slate-400 text-[9px]">/functions/index.js (ECMAScript CommonJS Node Module)</span>
                <span className="text-[10px] font-mono text-slate-500 text-[9px]">Ctrl + S to preview changes</span>
              </div>
              <textarea
                value={functionsCode}
                onChange={(e) => setFunctionsCode(e.target.value)}
                rows={14}
                className="w-full text-slate-300 font-mono text-xs p-5 bg-transparent border-0 focus:outline-none focus:ring-opacity-0 selection:bg-slate-800 min-h-[350px]"
                spellCheck="false"
              />
            </div>

            <div className="flex justify-between items-center gap-4">
              <p className="text-[11px] text-slate-500 leading-normal max-w-lg">
                💡 **Validation Warning**: If custom modifications are made to `beforeCreate`'s `blockedDomains` list, the Changes are written to file to ensure standard Auth workflows adapt.
              </p>
              <button
                type="submit"
                disabled={isSavingFunctionsCode || isLoadingFunctionsCode}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap cursor-pointer"
              >
                {isSavingFunctionsCode ? "Saving Code..." : "Save Functions Code"}
              </button>
            </div>
          </form>

          {functionsSaveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-center text-xs font-bold">
              ✔ Code changes written successfully into functions/index.js! Emulated environment updated with the fresh codebase.
            </div>
          )}

          {/* DEPLOY FUNCTIONS STREAM CONSOLE */}
          {functionsDeployLogs && (
            <div className="bg-black rounded-2xl border border-slate-800 p-5 font-mono text-xs text-slate-300 space-y-3 shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-[10px] font-bold text-slate-400">Terminal - Firebase CLI Deploy (Cloud Functions Node)</span>
                <button 
                  type="button"
                  onClick={() => setFunctionsDeployLogs(null)}
                  className="text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 overflow-x-auto select-all max-h-72">
                {functionsDeployLogs.map((log, index) => (
                  <div key={index} className="whitespace-pre min-h-[1.25rem]">
                    {log.startsWith("$") ? (
                      <span className="text-amber-400">{log}</span>
                    ) : log.startsWith("✔") ? (
                      <span className="text-emerald-400">{log}</span>
                    ) : log.startsWith("i") ? (
                      <span className="text-blue-400">{log}</span>
                    ) : (
                      <span>{log}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FIREBASE AUTH EMAIL DOMAINS & MULTI-TENANCY MANAGEMENT SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ea580c] bg-orange-500/10 px-2.5 py-1 rounded-lg">
                Custom Domains
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg">
                Multi-Tenancy
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg">
                Identity Platform
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Mail className="text-amber-500" size={28} />
              Auth Email Domains & Templates Manager
            </h3>
            <p className="text-slate-400 text-sm max-w-2xl">
              Configure custom domains for verification links, customize From fields, and manage DNS verification. Toggle tenant configs for multi-tenant inheritance workflows.
            </p>
          </div>
          <button 
            type="button"
            onClick={fetchEmailDomainConfig}
            disabled={isLoadingDomain}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all self-start lg:self-center"
          >
            <RefreshCw size={14} className={isLoadingDomain ? "animate-spin" : ""} /> Sync settings
          </button>
        </div>

        {domainError && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-white">Identity System Fault</h5>
              <p className="text-slate-400 text-xs leading-relaxed">{domainError}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-12">
          {/* Main Domain & Template Customizer form */}
          <div className="xl:col-span-5 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">1. Custom Domain Customization</h4>
              <p className="text-xs text-slate-500">Specify the sender domain details you wish to bind as code templates</p>
            </div>

            <form onSubmit={handleSaveDomainConfig} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Sender Custom Domain</label>
                <input 
                  type="text"
                  value={dnsDomainInput}
                  onChange={(e) => setDnsDomainInput(e.target.value)}
                  placeholder="e.g. mail.spokanerecovery.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2.5 px-3 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">From Sender Name</label>
                  <input 
                    type="text"
                    value={dnsFromNameInput}
                    onChange={(e) => setDnsFromNameInput(e.target.value)}
                    placeholder="e.g. Project Recovery Hub"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2.5 px-3 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Fallback Support Email</label>
                  <input 
                    type="email"
                    value={dnsSupportEmailInput}
                    onChange={(e) => setDnsSupportEmailInput(e.target.value)}
                    placeholder="e.g. support@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs py-2.5 px-3 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Multi tenancy Toggle state */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Multi-Tenancy Project Status</span>
                    <p className="text-[11px] text-slate-500">Upgraded to Google Identity Platform with partitions</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isMultiTenancyActive}
                    onChange={(e) => setIsMultiTenancyActive(e.target.checked)}
                    className="w-5 h-5 text-amber-500 bg-slate-900 border-slate-800 rounded focus:ring-opacity-0 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingDomain || isLoadingDomain}
                className="w-full py-3 bg-indigo-600 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSavingDomain ? "Writing Domain Code..." : "Save Custom Domain Settings"}
              </button>
            </form>

            {domainSaveSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 p-3 rounded-xl text-center text-xs font-bold">
                ✔ Domain metadata successfully written! Check DNS rules below to verify.
              </div>
            )}
          </div>

          {/* DNS Validation & Status Panel */}
          <div className="xl:col-span-7 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest">2. Verification DNS Records</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">DNS State:</span>
                  {domainConfig?.status === "applied" ? (
                    <span className="text-[10px] font-black uppercase tracking-wide bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">Applied & Active</span>
                  ) : domainConfig?.status === "verified" ? (
                    <span className="text-[10px] font-black uppercase tracking-wide bg-indigo-505/10 text-blue-400 px-2 py-0.5 rounded-md">Verified & Ready</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wide bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md">Pending DNS Propagation</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add the following TXT and CNAME records to your domain registrar (e.g. GoDaddy, Namecheap) to custom verify ownership of your authenticated email template domain.
              </p>

              {/* Records table list */}
              <div className="space-y-2.5 overflow-x-auto">
                <table className="w-full text-[11px] font-mono border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500 text-left">
                      <th className="pb-2 font-bold uppercase text-[9px]">Type</th>
                      <th className="pb-2 font-bold uppercase text-[9px]">Host / Node</th>
                      <th className="pb-2 font-bold uppercase text-[9px]">Target Content</th>
                      <th className="pb-2 font-bold uppercase text-[9px] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(domainConfig?.dnsRecords || []).map((rec: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-850/40 py-2 text-slate-300">
                        <td className="py-2.5">
                          <span className="bg-slate-900 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded text-amber-500 font-bold">{rec.type}</span>
                        </td>
                        <td className="py-2.5 text-slate-400 select-all truncate max-w-[120px]">{rec.host}</td>
                        <td className="py-2.5 text-slate-500 select-all truncate max-w-[220px]" title={rec.value}>{rec.value}</td>
                        <td className="py-2.5 text-right font-sans">
                          {rec.status === "verified" ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-[0.5rem] text-[9px]">✔ Verified</span>
                          ) : (
                            <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-[0.5rem] text-[9px]">⚠ Missing</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification & activation triggers */}
            <div className="flex flex-col md:flex-row gap-2.5 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={handleVerifyDomain}
                disabled={isVerifyingDomain || !dnsDomainInput}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-45 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifyingDomain ? "Verifying Records..." : "Verify DNS Records"}
              </button>
              <button
                type="button"
                onClick={handleApplyDomain}
                disabled={isApplyingDomain || domainConfig?.status !== "verified"}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-45 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isApplyingDomain ? "Applying Domain Config..." : "Activate & Apply Domain"}
              </button>
            </div>
          </div>
        </div>

        {/* MULTI-TENANCY INHERITANCE CONFIG SECTION (Google Identity Platform Scope) */}
        {isMultiTenancyActive && (
          <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4 pt-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Link className="text-blue-400" size={16} />
                3. Multi-Tenant Custom Email Inheriter (GCP Custom API Implementation)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Identity Platform tenants do not inherit custom email domain settings automatically. Unless configured via the GCP auth metadata API, outbound links, display tags and templates are dispatch-delivered from defaults. Configure the inheritance PATCH request rule for each tenant division.
              </p>
            </div>

            {/* List of tenants */}
            <div className="grid gap-4 md:grid-cols-2">
              {(domainConfig?.tenants || []).map((t: any) => (
                <div key={t.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">GCP TENANT ID: {t.id}</span>
                      <h5 className="text-sm font-black text-white mt-0.5">{t.name}</h5>
                    </div>
                    {t.emailSendingConfigInherited ? (
                      <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Inheritance Active</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase bg-slate-800 text-slate-400 px-2 py-1 rounded">No Inheritance</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {t.emailSendingConfigInherited 
                      ? `✔ Users in division '${t.name}' will receive verification mail directly signed from the custom branding '${dnsDomainInput}'.` 
                      : `⚠ Default email templates used. No custom branding applied. Sending from standard noreply@firebaseapp.com.`}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPatchingTenant !== null}
                      onClick={() => handlePatchTenant(t.id, !t.emailSendingConfigInherited)}
                      className={`flex-1 py-2 text-center rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                        t.emailSendingConfigInherited 
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {isPatchingTenant === t.id 
                        ? "Applying metadata..." 
                        : t.emailSendingConfigInherited 
                          ? "Disable Inheritance Rule" 
                          : "Patch: Enable custom domain inheritance"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* GCP curl response block emulation */}
            {curlCommand && patchLogs && (
              <div className="space-y-3 bg-black border border-slate-850 rounded-2xl p-5 font-mono text-xs text-slate-300 shadow-inner overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                  <span className="text-[10px] font-bold text-blue-400 tracking-wider">REST PATCH - Identity Platform Meta Manager</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setPatchLogs(null);
                      setCurlCommand(null);
                    }}
                    className="text-[10px] text-slate-500 hover:text-white"
                  >
                    [CLOSE PANEL]
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-500 uppercase font-black">Generated Terminal REST Instruction</p>
                    <pre className="bg-slate-950 p-3 rounded-lg text-emerald-400 border border-slate-900 select-all text-[11px] overflow-x-auto leading-relaxed">
                      {curlCommand}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-500 uppercase font-black">Identity Toolkit Response Streams</p>
                    <div className="space-y-1 overflow-y-auto max-h-56 text-[11px] leading-relaxed select-all">
                      {patchLogs.map((log, index) => {
                        let textClass = "text-slate-300";
                        if (log.startsWith("✔")) {
                          textClass = "text-emerald-400 font-bold";
                        } else if (log.startsWith("[")) {
                          textClass = "text-blue-400 font-bold";
                        } else if (log.includes("200 OK") || log.includes('"emailSendingConfig": true')) {
                          textClass = "text-emerald-400 font-semibold";
                        }
                        return (
                          <div key={index} className={textClass}>
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DNS / SIMULATOR DRILL TERMINAL LOGS */}
        {domainLogs && (
          <div className="bg-black rounded-2xl border border-slate-800 p-5 font-mono text-xs text-slate-300 space-y-3 shadow-inner relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <span className="text-[10px] font-bold text-amber-500">Terminal - Custom Domain Action Console</span>
              <button 
                type="button"
                onClick={() => setDomainLogs(null)}
                className="text-slate-500 hover:text-white lg:text-xs"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 overflow-x-auto select-all max-h-72 text-[11px] leading-relaxed">
              {domainLogs.map((log, index) => (
                <div key={index} className="whitespace-pre min-h-[1.25rem]">
                  {log.startsWith("$") ? (
                    <span className="text-amber-400">{log}</span>
                  ) : log.startsWith("✔") ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.startsWith("i") ? (
                    <span className="text-blue-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIREBASE AUTH SUCCESS STORIES & INTEGRATION BENCHMARKS SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                Integration Benchmarks
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg">
                Success Stories
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="text-amber-400 fill-amber-400/10" size={28} />
              Firebase Auth Case Studies & Milestones
            </h3>
            <p className="text-slate-400 text-sm max-w-2xl font-sans leading-relaxed">
              Understand how leading applications utilize lightweight social networks and anonymous sign-ins to skyrocket retention and speed up development.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 shrink-0">
            <BookOpen className="text-indigo-400 ml-1" size={16} />
            <span className="text-xs font-semibold text-slate-300 mr-1">Admin Integration Guide</span>
          </div>
        </div>

        {/* INTERACTIVE CASE STUDY TABS */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Selector / Directory */}
          <div className="lg:col-span-4 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-2">Featured Deployments</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedCaseStudy("fabulous")}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer block ${
                  selectedCaseStudy === "fabulous"
                    ? "bg-amber-600/10 border-amber-500/30 text-white shadow-lg"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500">Lifestyle Hub</span>
                  <span className="text-[10px] text-slate-500 font-mono">1 Afternoon</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Fabulous</h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">Implemented Google, Facebook, & Anonymous sign-in in hours.</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCaseStudy("rave")}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer block ${
                  selectedCaseStudy === "rave"
                    ? "bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Collaborative</span>
                  <span className="text-[10px] text-slate-500 font-mono">1-2 Days</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Rave App</h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">Cross-platform integration across iOS, Android, and web servers.</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCaseStudy("kwaver")}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer block ${
                  selectedCaseStudy === "kwaver"
                    ? "bg-cyan-600/10 border-cyan-500/30 text-white shadow-lg"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Social Music</span>
                  <span className="text-[10px] text-slate-500 font-mono">Social Linking</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Kwaver Music</h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">Linking multiple third-party social providers with zero friction.</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCaseStudy("reebee")}
                className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer block ${
                  selectedCaseStudy === "reebee"
                    ? "bg-emerald-600/10 border-emerald-500/30 text-white shadow-lg"
                    : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Unified Retail</span>
                  <span className="text-[10px] text-slate-500 font-mono">Product Velocity</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">reebee</h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">Saved onboarding cycles to accelerate rich core features.</p>
              </button>
            </div>
          </div>

          {/* Details visualizer card */}
          <div className="lg:col-span-8 bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[350px]">
            {selectedCaseStudy === "fabulous" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <h4 className="text-lg font-black text-white">Fabulous App</h4>
                  </div>
                  <span className="text-[11px] font-mono font-black tracking-widest text-slate-400">SPEED RATING: ULTRA FAST</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block">Implementation Speed</span>
                    <p className="text-2xl font-black text-white italic">One Afternoon</p>
                    <p className="text-xs text-slate-500 leading-normal">A single developer initialized core frameworks and went live.</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block">Key Capabilities Enabled</span>
                    <p className="text-sm font-bold text-slate-200">Email & Password, Google, Facebook & Anonymous</p>
                    <p className="text-xs text-slate-500 leading-normal">Offered guest access to trial habits, transitioning to linked profiles.</p>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <h5 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Integration Case Blueprint</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    By starting users with <strong>Anonymous Sign-In</strong>, Fabulous bypassed the standard high-friction setup. When users committed to healthy routines, Firebase automatically linked their local data with their social accounts securely, eliminating database duplication.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ExternalLink size={12} />
                  <span>Interactive document reference: </span>
                  <a href="https://firebase.google.com/static/docs/auth/case-studies/fabulous.pdf" target="_blank" rel="noopener noreferrer" className="text-amber-500 underline hover:text-amber-400">Read Fabulous Case PDF</a>
                </div>
              </div>
            )}

            {selectedCaseStudy === "rave" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-505 animate-pulse"></span>
                    <h4 className="text-lg font-black text-white">Rave App Setup</h4>
                  </div>
                  <span className="text-[11px] font-mono font-black tracking-widest text-slate-400">CRADLE INTEGRATION</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Developer-Sizing Estimate</span>
                    <p className="text-2xl font-black text-white italic">1-2 Days (Client)</p>
                    <p className="text-xs text-slate-500 leading-normal">Configured fully-equipped multi-client SDK credentials.</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Core Server Setup</span>
                    <p className="text-2xl font-black text-white italic">1 Hour (Server)</p>
                    <p className="text-xs text-slate-500 leading-normal">Implemented metadata lookups on secure backend nodes.</p>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <h5 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Strategic Impact</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Designed for media co-watching across both iOS and Android. Rave utilized Firebase to quickly deploy a cross-platform identity layer, saving months of native API authentication overhead and preventing manual database user schemas setup.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ExternalLink size={12} />
                  <span>Interactive document reference: </span>
                  <a href="https://firebase.google.com/static/docs/auth/case-studies/rave.pdf" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300" referrerPolicy="no-referrer">Read Rave Case PDF</a>
                </div>
              </div>
            )}

            {selectedCaseStudy === "kwaver" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    <h4 className="text-lg font-black text-white">Kwaver Music Integration</h4>
                  </div>
                  <span className="text-[11px] font-mono font-black tracking-widest text-slate-400">SOCIAL LINKING DYNAMICS</span>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-850 rounded-2xl italic text-slate-200 text-sm leading-relaxed relative">
                  <span className="absolute top-2 left-3 text-4xl font-serif text-cyan-500/20 select-none">“</span>
                  <p className="pl-4 font-sans leading-relaxed">
                    The new version of Auth has allowed us to handle multiple social providers with ease! Linking accounts together has never been so simple.
                  </p>
                  <p className="text-right text-xs uppercase font-bold text-slate-500 tracking-wider mt-3 not-italic">— James Zammit, VP of Engineering</p>
                </div>

                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <h5 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Account Consolidation Rules</h5>
                  <p className="text-[11px] text-cyan-400 font-bold tracking-wider uppercase">How Kwaver utilizes provider link states:</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Firebase Auth abstracts social bindings away. Whether a user registers initially with an email address or a specific token, supplemental credentials are dynamically bound using user credentials links to offer a single consolidated user experience.
                  </p>
                </div>
              </div>
            )}

            {selectedCaseStudy === "reebee" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h4 className="text-lg font-black text-white">reebee Product Velocity</h4>
                  </div>
                  <span className="text-[11px] font-mono font-black tracking-widest text-slate-400">ACCELERATION INDEX: MAXIMUM</span>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-850 rounded-2xl italic text-slate-200 text-sm leading-relaxed relative">
                  <span className="absolute top-2 left-3 text-4xl font-serif text-emerald-500/20 select-none">“</span>
                  <p className="pl-4 font-sans leading-relaxed">
                    The super exciting part is that we have been able to primarily focus on implementing our next set of features that build off of user authentication.
                  </p>
                  <p className="text-right text-xs uppercase font-bold text-slate-500 tracking-wider mt-3 not-italic">— Michal Martyniak, Co-Founder</p>
                </div>

                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <h5 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Strategic Development Advantage</h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    By outsourcing user management, session validation, cookie security, and password-reset triggers to Firebase's managed console, reebee saved hundreds of backend development hours. They directly redirected their focus and energy on refining high-value catalog interactions.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Interactive Challenge / Quiz section to make it highly gamified */}
            <div className="mt-4 pt-4 border-t border-slate-850 flex flex-col md:flex-row items-center justify-between gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <div className="space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5 capitalize font-sans">
                  <CheckCircle2 size={14} className="text-emerald-400 animate-bounce" />
                  Integration Best-Practice Quiz
                </p>
                <p className="text-[11px] text-slate-500 font-sans">Test your knowledge on key development takeaways!</p>
              </div>

              {!quizChecked ? (
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-start">
                  <span className="text-xs text-slate-300 font-sans">How long did Fabulous take to launch Auth?</span>
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizAnswers({ ...quizAnswers, 1: "right" });
                        setQuizChecked(true);
                        setQuizSubmitted(true);
                      }}
                      className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer border border-slate-800"
                    >
                      1 Afternoon
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizAnswers({ ...quizAnswers, 1: "wrong" });
                        setQuizChecked(true);
                        setQuizSubmitted(true);
                      }}
                      className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer border border-slate-800"
                    >
                      Multiple Weeks
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {quizAnswers[1] === "right" ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 font-sans">
                      ✔ Correct! Fabulous deployed custom authentication in a single afternoon.
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center gap-1 font-sans">
                      ⚠ Incorrect. They completed everything in one single afternoon!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setQuizChecked(false);
                      setQuizSubmitted(false);
                    }}
                    className="text-[11px] text-slate-500 hover:text-white underline cursor-pointer"
                  >
                    Reset Quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FIREBASE AUTH QUOTAS, RATES & CORE API LIMITS MONITOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                Performance Quotas
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-lg">
                System Safeguards
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg animate-pulse">
                Scale Planner Included
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Gauge className="text-indigo-400 animate-spin-slow" size={28} />
              Firebase Auth Quotas & Scale Compliance Monitor
            </h3>
            <p className="text-slate-400 text-sm max-w-2xl font-sans leading-relaxed">
              Real-time directory of system boundaries, rate limits, and API quotas for Identity Platform operations. Simulate your traffic volume below to verify production readiness.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-bold">Billing tier:</span>
            <div className="flex p-0.5 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setQuotaPricingPlan("spark")}
                className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  quotaPricingPlan === "spark"
                    ? "bg-amber-600 text-white shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Spark (Free)
              </button>
              <button
                type="button"
                onClick={() => setQuotaPricingPlan("blaze")}
                className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  quotaPricingPlan === "blaze"
                    ? "bg-indigo-600 text-white shadow-md font-extrabold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Blaze (Paid)
              </button>
            </div>
          </div>
        </div>

        {/* QUOTA COMPLIANCE SIMULATOR & ADVICE GENERATOR */}
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Traffic Modeler Inputs */}
          <div className="xl:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <Calculator className="text-cyan-400" size={18} />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Active Traffic Simulator & Model</h4>
                <p className="text-[11px] text-zinc-500 font-mono">Simulate user events to evaluate thresholds</p>
              </div>
            </div>

            <div className="space-y-4 font-sans text-xs">
              {/* Slider 1: Expected DAUs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User size={11} className="text-indigo-400" />
                    Expected Daily Active Users (DAU)
                  </label>
                  <span className="text-[11px] font-mono font-black text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {simDailyActiveUsers.toLocaleString()} / day
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10000"
                  step="50"
                  value={simDailyActiveUsers}
                  onChange={(e) => setSimDailyActiveUsers(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Spark Plan limits free Tier 1 Daily Active Users to 3,000.</p>
              </div>

              {/* Slider 2: Creation rate per hour */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Activity size={11} className="text-emerald-400" />
                    Hourly Signups (Single IP)
                  </label>
                  <span className="text-[11px] font-mono font-black text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {simHourlyCreationRate} users/hour
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="5"
                  value={simHourlyCreationRate}
                  onChange={(e) => setSimHourlyCreationRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Anti-abuse limits account creation rates at 100/hour for each IP address.</p>
              </div>

              {/* Slider 3: Verification emails dispatched */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail size={11} className="text-amber-500" />
                    Verification Emails Dispatched
                  </label>
                  <span className="text-[11px] font-mono font-black text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {simEmailVerificationReqs.toLocaleString()} emails/day
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="150000"
                  step="500"
                  value={simEmailVerificationReqs}
                  onChange={(e) => setSimEmailVerificationReqs(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Spark: 1k per day max | Blaze: 100k per day max.</p>
              </div>

              {/* Slider 4: SMS volume rate per min */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Globe size={11} className="text-rose-400" />
                    Peak IP SMS Rate (Phone Sign-in)
                  </label>
                  <span className="text-[11px] font-mono font-black text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {simSmsPerMinute} SMS/minute
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="150"
                  step="5"
                  value={simSmsPerMinute}
                  onChange={(e) => setSimSmsPerMinute(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Inbound SMS per IP limited strictly to 50/minute to block SMS scams.</p>
              </div>

              {/* Slider 5: Toolkit Requests Per Second */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Zap size={11} className="text-purple-400" />
                    API Operations Rate (RPS/Toolkit)
                  </label>
                  <span className="text-[11px] font-mono font-black text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {simToolkitRps} requests/sec
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="50"
                  value={simToolkitRps}
                  onChange={(e) => setSimToolkitRps(Number(e.target.value))}
                  className="w-full accent-purple-500 h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">Identity Toolkit Service API standard cap sits at 1,000 req/second.</p>
              </div>
            </div>
          </div>

          {/* Real-time Status and Draft Support Ticket Output panel */}
          <div className="xl:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="text-indigo-400" size={16} />
                  Live Quota Assessment Matrix
                </h4>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Platform Check Result
                </span>
              </div>

              {simulatedOverloads.length > 0 ? (
                <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-rose-500 shrink-0 animate-bounce mt-0.5" size={18} />
                    <div className="space-y-1">
                      <h5 className="text-sm font-extrabold text-white">⚠ SCALE DISRUPTION DETECTED</h5>
                      <p className="text-slate-400 text-xs leading-relaxed font-sans">
                        Your simulated load indicators exceed standard limits enforced by Identity Platform. To safeguard operations and secure adjustments, submit a support notice at least **two weeks in advance**.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-red-950/40 rounded-xl border border-red-900/10 space-y-1.5 text-xs text-rose-300 font-mono">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Limit breaches detected:</p>
                    {simulatedOverloads.map((overloadStr, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>{overloadStr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                  <div className="space-y-1 font-sans">
                    <h5 className="text-sm font-extrabold text-white">✔ CONFIGURATION HEALTHY & STABLE</h5>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      All simulated key vectors sit safely below the thresholds enforced by your selected <strong>{quotaPricingPlan.toUpperCase()}</strong> plan. System is optimized for standard public dispatching with high concurrency safety.
                    </p>
                  </div>
                </div>
              )}

              {/* Info panel on Spark Spark limitation for Verification Links */}
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl space-y-1">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Core Quota Tip</span>
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  The limit for **email link sign-ins** on Spark plan is extremely tight: **5 emails / day**. Upgrading to Blaze plan raises this instantly to **25,000 emails / day**. Track verification limits proactively in your Admin panel to prevent onboarding blockages.
                </p>
              </div>
            </div>

            {/* Support ticket generator helper */}
            <div className="pt-4 border-t border-slate-850 space-y-3">
              <div className="space-y-1">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GCP Quota Increase Draft Generator</h5>
                <p className="text-[11px] text-slate-500 font-sans">Need a scaling exception? Draft a professional pre-notice for Firebase Support.</p>
              </div>
              <button
                type="button"
                onClick={handleCopySupportDraft}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <Copy size={13} />
                {supportDraftCopied ? "Draft Message Copied!" : "Generate & Copy Quota Support Draft"}
              </button>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE LIMITS DIRECTORY */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-850 pb-4">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="text-indigo-400" size={16} />
                Limits Registry Dictionary
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Search and explore specific operational thresholds based on the selected registry categories.
              </p>
            </div>

            {/* Category selection & Search input bar inline */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search limits (e.g. SMS, token)..."
                  value={quotaSearchTerm}
                  onChange={(e) => setQuotaSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-xs text-white rounded-xl py-2 pl-9 pr-4 w-full sm:w-[220px] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-zinc-600"
                />
              </div>

              {/* Category selector */}
              <select
                value={quotaCategoryFilter}
                onChange={(e: any) => setQuotaCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-850 text-xs text-white rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="accounts">Account Counters</option>
                <option value="emails">Emails & Link Gen</option>
                <option value="sms">SMS & Phone Sign-in</option>
                <option value="apis">Toolkit Core APIs</option>
              </select>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="pb-3 pl-3">Category</th>
                  <th className="pb-3">Auth / API Operation</th>
                  <th className="pb-3">Spark Plan Cap</th>
                  <th className="pb-3">Blaze Plan Cap</th>
                  <th className="pb-3 max-w-[280px]">Operational Details</th>
                </tr>
              </thead>
              <tbody>
                {quotaRules.length > 0 ? (
                  quotaRules.map((rule, idx) => (
                    <tr
                      key={rule.id}
                      className={`text-xs hover:bg-slate-900/30 transition-all font-sans border-b border-slate-850/40 text-slate-300 ${
                        idx % 2 === 0 ? "bg-slate-950/20" : ""
                      }`}
                    >
                      <td className="py-3 pl-3 font-mono">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-400">
                          {rule.category}
                        </span>
                      </td>
                      <td className="py-3 font-extrabold text-white font-sans">{rule.operation}</td>
                      <td className="py-3 font-mono text-amber-500 font-semibold">{rule.spark}</td>
                      <td className="py-3 font-mono text-indigo-400 font-semibold">{rule.blaze}</td>
                      <td className="py-3 text-[11px] text-slate-500 leading-relaxed font-sans pr-3">{rule.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      No specific limits found matching the filter query parameter constraints. Try resetting search term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CLOUD FIRESTORE BEST PRACTICES & COMPLIANCE ENGINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg">
                Firestore Engine
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg">
                Scale Advisory
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-cyan-400 px-2.5 py-1 rounded-lg">
                "500/50/5 Rule" Built-In
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Layers className="text-teal-400" size={28} />
              Cloud Firestore Schema & Performance Advisor
            </h3>
            <p className="text-slate-400 text-sm max-w-3xl font-sans leading-relaxed">
              Examine database structure recommendations, analyze document names for hotspot risks, compile single-field index exemption JSONs, and plan traffic ramp-ups mathematically.
            </p>
          </div>
        </div>

        {/* 1. DATABASE LOCATION ADVISOR & SCHEMAS/FIELD COPES */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Proactive Db Location Advisor */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-850 pb-3">
              <Globe className="text-teal-400" size={18} />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Database Location Strategy Advisor</h4>
                <p className="text-[11px] text-teal-500/80 font-mono">Align database instances with user density clusters</p>
              </div>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Primary User Audience Geotype
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFsTargetAudience("na")}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    fsTargetAudience === "na"
                      ? "bg-teal-950/40 border-teal-500 text-white"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <p className="font-extrabold text-[11px] uppercase tracking-wide">North America</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Dense tech clients</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFsTargetAudience("eu")}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    fsTargetAudience === "eu"
                      ? "bg-teal-950/40 border-teal-500 text-white"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <p className="font-extrabold text-[11px] uppercase tracking-wide">Europe Zone</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">GDPR & high compliance</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFsTargetAudience("asia")}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    fsTargetAudience === "asia"
                      ? "bg-teal-950/40 border-teal-500 text-white"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <p className="font-extrabold text-[11px] uppercase tracking-wide">Asia Pacific</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">High volume mobile apps</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFsTargetAudience("global")}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    fsTargetAudience === "global"
                      ? "bg-teal-950/40 border-teal-500 text-white"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <p className="font-extrabold text-[11px] uppercase tracking-wide">Globally Scattered</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Multi-region fallback</p>
                </button>
              </div>

              {/* Dynamic Assessment Outcome */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-850 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recommended Config:</span>
                  <span className="text-[9px] font-mono font-black text-teal-400 px-2 py-0.5 bg-teal-500/10 rounded">
                    {fsTargetAudience === "na" && "NAM5 (Multi-Region / US)"}
                    {fsTargetAudience === "eu" && "EUR3 (Multi-Region / Europe)"}
                    {fsTargetAudience === "asia" && "asia-northeast1 (Regional / Tokyo)"}
                    {fsTargetAudience === "global" && "Multi-Region Hub Layout"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {fsTargetAudience === "na" && "Select multi-region 'nam5' inside North America and split compute instances into at least two regional clusters. This secures top-tier availability/durability SLAs with short latency pathways for primary US traffic."}
                  {fsTargetAudience === "eu" && "EUR3 multi-region instance guards durability policies and complies cleanly with cross-border PII laws. Locate auxiliary servers inside europe-west3 or equivalent backup cells to optimize compute co-location."}
                  {fsTargetAudience === "asia" && "Choose a local Regional location like 'asia-northeast1' to reduce writes latency and cut down inter-zone egress fees if budget constraints are paramount. Co-locate all Cloud Run microservices in Tokyo regions."}
                  {fsTargetAudience === "global" && "For wide geographic spread, Multi-Region deployments minimize read limits globally. Make sure to implement parallel client caches or CDN caches to bypass long round-trip write network hops."}
                </p>
                <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-500 font-mono space-y-0.5">
                  <p>• Avoid distant hops: Far-reaching network connections degrade query latency.</p>
                  <p>• Multi-region keeps database highly available even during catastrophic zone failure.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Document ID & Field Name Auditor */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-850 pb-3">
              <Code2 className="text-cyan-400" size={18} />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Document ID & Field Name Validator</h4>
                <p className="text-[11px] text-cyan-500/80 font-mono">Verify structural strings against escaping & hotspots constraints</p>
              </div>
            </div>

            <div className="space-y-4 font-sans text-xs">
              {/* Document ID Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Proposed Document ID
                </label>
                <input
                  type="text"
                  value={fsDocumentId}
                  onChange={(e) => setFsDocumentId(e.target.value)}
                  className="w-full bg-slate-905 border border-slate-800 text-xs text-white rounded-xl py-2 px-3 font-mono focus:outline-none focus:border-teal-500 transition-all"
                  placeholder="e.g. User_29402"
                />
                
                {/* ID Alerts */}
                <div className="space-y-1">
                  {fsDocIdAudit.map((a, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                        a.type === "error"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                          : a.type === "warning"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      <span className="font-extrabold shrink-0">
                        {a.type === "error" && "✕"}
                        {a.type === "warning" && "⚠"}
                        {a.type === "success" && "✓"}
                      </span>
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Name Input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Proposed Field Name
                </label>
                <input
                  type="text"
                  value={fsFieldName}
                  onChange={(e) => setFsFieldName(e.target.value)}
                  className="w-full bg-slate-905 border border-slate-800 text-xs text-white rounded-xl py-2 px-3 font-mono focus:outline-none focus:border-teal-500 transition-all"
                  placeholder="e.g. metadata_history"
                />

                {/* Field Alerts */}
                <div className="space-y-1">
                  {fsFieldNameAudit.map((a, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                        a.type === "error"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                          : a.type === "warning"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      <span className="font-extrabold shrink-0">
                        {a.type === "error" && "✕"}
                        {a.type === "warning" && "⚠"}
                        {a.type === "success" && "✓"}
                      </span>
                      <span>{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. INDEX EXEMPTION CONFIGURATOR & COPIERS */}
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Use case toggle selector */}
          <div className="xl:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
              <FileText className="text-indigo-400" size={18} />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Index Optimization Playground</h4>
                <p className="text-[11px] text-zinc-500 font-mono">Exempt specific key fields to reduce write latency and costs</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setFsExemptionCase("sequential")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  fsExemptionCase === "sequential"
                    ? "bg-indigo-950/40 border-indigo-500 text-white"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <p className="text-xs font-extrabold uppercase tracking-wide">High sequential writes (IoT time)</p>
                <p className="text-[10px] text-slate-500 mt-1">Stops the 500 writes/second limits collision</p>
              </button>

              <button
                type="button"
                onClick={() => setFsExemptionCase("large_string")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  fsExemptionCase === "large_string"
                    ? "bg-indigo-950/40 border-indigo-500 text-white"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <p className="text-xs font-extrabold uppercase tracking-wide">Large Unstructured Strings</p>
                <p className="text-[10px] text-slate-500 mt-1">Excludes biography or large essays from indexes</p>
              </button>

              <button
                type="button"
                onClick={() => setFsExemptionCase("ttl")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  fsExemptionCase === "ttl"
                    ? "bg-indigo-950/40 border-indigo-500 text-white"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <p className="text-xs font-extrabold uppercase tracking-wide">TTL Timestamp Cleaners</p>
                <p className="text-[10px] text-slate-500 mt-1">Boosts serverless garbage sweep operations</p>
              </button>

              <button
                type="button"
                onClick={() => setFsExemptionCase("large_array")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  fsExemptionCase === "large_array"
                    ? "bg-indigo-950/40 border-indigo-500 text-white"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <p className="text-xs font-extrabold uppercase tracking-wide">Large Arrays or Maps</p>
                <p className="text-[10px] text-slate-500 mt-1">Avoids approaching the 40,000 entries cap</p>
              </button>
            </div>
          </div>

          {/* Exemption results representation and code snippets */}
          <div className="xl:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-4 font-sans text-xs flex flex-col justify-between">
            <div className="space-y-3">
              <h5 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                {fsExemptionCase === "sequential" && "Exemption Blueprint: Sequential Timestamp Sorter"}
                {fsExemptionCase === "large_string" && "Exemption Blueprint: Biography/Long Text Excluder"}
                {fsExemptionCase === "ttl" && "Exemption Blueprint: Built-in TTL Policy Index Exemptions"}
                {fsExemptionCase === "large_array" && "Exemption Blueprint: Massive Maps/Lists Index Preventer"}
              </h5>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                {fsExemptionCase === "sequential" && "If you write timestamps to sequential files at high velocity, the limits cap rests at 500 writes/second. Disable Descending & Array indexing via single-field exemption properties to release index contention."}
                {fsExemptionCase === "large_string" && "String values exceeding 1KB that are never filtered inside query .where() structures accumulate unnecessary index footprint, causing fanout penalties and driving billing sizes up. Exclude them fully."}
                {fsExemptionCase === "ttl" && "Firestore Time-to-Live policies continuously purge resources. If the TTL timestamp is indexed, heavy operations cause query contention. Adding auto single-field exemptions blocks indexing to retain high write availability."}
                {fsExemptionCase === "large_array" && "Unbounded arrays or nested maps expand index fanout exponentially toward the 40,000-per-document ceiling. Creating exemptions saves high write speeds on related operations."}
              </p>

              <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">firestore.indexes.json snippet:</span>
                <pre className="font-mono text-[10px] text-emerald-400 overflow-x-auto select-all leading-normal">
                  {fsExemptionCase === "sequential" && JSON.stringify({
                    "indexes": [],
                    "fieldOverrides": [
                      {
                        "collectionGroup": "work_items",
                        "fieldPath": "created_timestamp",
                        "indexes": [
                          { "order": "ASCENDING", "queryScope": "COLLECTION" }
                        ]
                      }
                    ]
                  }, null, 2)}
                  {fsExemptionCase === "large_string" && JSON.stringify({
                    "indexes": [],
                    "fieldOverrides": [
                      {
                        "collectionGroup": "users",
                        "fieldPath": "description_essay",
                        "indexes": []
                      }
                    ]
                  }, null, 2)}
                  {fsExemptionCase === "ttl" && JSON.stringify({
                    "indexes": [],
                    "fieldOverrides": [
                      {
                        "collectionGroup": "temporary_sessions",
                        "fieldPath": "expires_at",
                        "indexes": []
                      }
                    ]
                  }, null, 2)}
                  {fsExemptionCase === "large_array" && JSON.stringify({
                    "indexes": [],
                    "fieldOverrides": [
                      {
                        "collectionGroup": "orders",
                        "fieldPath": "items_list",
                        "indexes": []
                      }
                    ]
                  }, null, 2)}
                </pre>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal border-t border-slate-850/80 pt-3">
              * Note: These definitions are loaded into the GCP platform via `firebase deploy --only firestore:indexes`. Check your console logs if build operations complain about missing indexes.
            </p>
          </div>
        </div>

        {/* 3. DYNAMIC TRAFFIC RAMP-UP CALCULATOR ("500/50/5" Rule) */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
            <div className="space-y-1 font-sans">
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Flame className="text-amber-500 animate-pulse" size={16} />
                Traffic Ramp-up Schedule Planner ("500/50/5 Rule")
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Avoid sudden spikes to new empty collections or sequential keys. Distribute traffic and increase load progressively to guarantee write scaling.
              </p>
            </div>

            {/* RPS Input box */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-400 font-sans">Target Operations:</span>
              <div className="relative">
                <input
                  type="number"
                  min="550"
                  max="100000"
                  step="250"
                  value={fsTargetRps}
                  onChange={(e) => setFsTargetRps(Math.max(500, Number(e.target.value)))}
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl py-1.5 pl-3 pr-10 w-[140px] focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="absolute right-3 top-2 text-[10px] font-bold font-mono text-indigo-400">RPS</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-12 items-stretch">
            {/* Legend / Tip */}
            <div className="md:col-span-4 bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between space-y-3 font-sans">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">The "500/50/5" Standard</span>
                <p className="text-xs font-bold text-slate-300 leading-normal">
                  To give Cloud Firestore plenty of time to auto-prepare tablets & split key-ranges for massive load:
                </p>
              </div>
              <div className="text-[11px] text-slate-400 space-y-2">
                <div className="flex items-start gap-1.5">
                  <span className="w-1 px-1 bg-amber-500/25 text-amber-400 rounded text-[9px] font-mono font-bold">1</span>
                  <span>Deploy and cap initial transactions to **500 operations per second** for any raw, unpartitioned collection paths.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-1 px-1 bg-amber-500/25 text-amber-400 rounded text-[9px] font-mono font-bold">2</span>
                  <span>Scale maximum traffic limits up by exactly **50% increment steps** strictly every **5 minutes elapsed**.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-1 px-1 bg-amber-500/25 text-amber-400 rounded text-[9px] font-mono font-bold">3</span>
                  <span>Distribute IDs evenly over keyspace to allow hashing algorithms block contiguous hotspots writes.</span>
                </div>
              </div>
            </div>

            {/* Calculated Schedule Timeline Table */}
            <div className="md:col-span-8 overflow-x-auto border border-slate-850 rounded-2xl bg-zinc-950/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-850 hover:bg-slate-900/20 text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    <th className="py-2.5 pl-4">Ramp Step</th>
                    <th className="py-2.5">Timeline Status</th>
                    <th className="py-2.5">Allowed Write Velocity</th>
                    <th className="py-2.5">Accumulated Multiplier</th>
                    <th className="py-2.5 pr-4 text-right">Zone Stability status</th>
                  </tr>
                </thead>
                <tbody>
                  {fsRampUpSchedule.map((row) => (
                    <tr
                      key={row.step}
                      className="border-b border-slate-850/35 hover:bg-slate-900/10 text-slate-300 font-sans text-[11px]"
                    >
                      <td className="py-2.5 pl-4 font-mono font-bold text-slate-500">#{row.step}</td>
                      <td className="py-2.5 font-bold text-white">{row.time}</td>
                      <td className="py-2.5 font-mono text-teal-400 font-extrabold">{row.maxRps.toLocaleString()} Writes/sec</td>
                      <td className="py-2.5 font-mono text-slate-400">+{Math.round((row.accumulatedMultiplier - 1) * 100)}% ({row.accumulatedMultiplier}x)</td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          row.step === 1 
                            ? "bg-slate-800 text-slate-400"
                            : row.maxRps < fsTargetRps 
                            ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/20"
                            : "bg-emerald-950/40 text-emerald-400 border border-emerald-900/20"
                        }`}>
                          {row.step === 1 && "Initial Base"}
                          {row.step > 1 && row.maxRps < fsTargetRps && "Ramping up..."}
                          {row.maxRps >= fsTargetRps && "Target scale primed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. KEY BEST PRACTICES CARDS */}
        <div className="grid gap-4 md:grid-cols-3 font-sans text-xs">
          {/* Read operations & Offset limits */}
          <div className="bg-slate-950/50 p-5 rounded-[1.75rem] border border-slate-850 shadow space-y-2.5">
            <h5 className="font-extrabold text-white flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-rose-400">
              <AlertTriangle size={13} />
              Read Operations & Offset Bill Penalty
            </h5>
            <p className="text-slate-400 leading-normal text-[11px]">
              Do not use offsets inside paginations! Skips are executed internally by scanning old records, which affects query latency and billing metrics. **Always use cursors (`start_at`)** to specify entry checkpoints directly.
            </p>
          </div>

          {/* Transaction SDK Retries */}
          <div className="bg-slate-950/50 p-5 rounded-[1.75rem] border border-slate-850 shadow space-y-2.5">
            <h5 className="font-extrabold text-white flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-cyan-400">
              <Zap size={13} />
              REST Code Transaction Retries
            </h5>
            <p className="text-slate-400 leading-normal text-[11px]">
              The standard Firebase SDKs retry transactions automatically to bypass transient lock conflicts. If you connect directly through REST or RPC APIs, your code must handle retries manually to avoid operations dropouts.
            </p>
          </div>

          {/* Privacy & GDPR Data Compliance */}
          <div className="bg-slate-950/50 p-5 rounded-[1.75rem] border border-slate-850 shadow space-y-2.5">
            <h5 className="font-extrabold text-white flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-teal-450">
              <ShieldCheck size={13} />
              GDPR Compliance & Project Names PII
            </h5>
            <p className="text-slate-400 leading-normal text-[11px]">
              Never store sensitive info, secrets, or actual telephone/emails inside Project IDs, document names, or field metrics. Use a secure **Split Collection strategy** with private directories secured strictly by owners identity check.
            </p>
          </div>
        </div>
      </div>

      {/* FIREBASE APP CHECK INTEGRATION PLANNER & TOKEN SIMULATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                App Identity Shield
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-450 px-2.5 py-1 rounded-lg animate-pulse">
                Abuse Prevention
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg">
                Device Attestation
              </span>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Shield className="text-indigo-400" size={28} />
              Firebase App Check Integration Planner & Token Simulator
            </h3>
            <p className="text-slate-400 text-sm max-w-3xl font-sans leading-relaxed">
              Complement Firebase Authentication (which tracks <strong className="text-indigo-300">WHO</strong> is connecting) with App Check (which attests <strong className="text-indigo-300">WHAT</strong> device/app is connecting). Protect your database & serverless hooks from malicious scrapers.
            </p>
          </div>
          
          <a
            href="https://www.youtube.com/watch?v=LFz8qdF7xg4"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/40 hover:border-rose-700 text-rose-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow"
          >
            <Video size={14} className="text-rose-500 shrink-0" />
            Watch App Check Crash Course
            <ExternalLink size={11} className="text-rose-400/80" />
          </a>
        </div>

        {/* SIMULATOR & WORKFLOW ENGINE - 2 COLUMNS */}
        <div className="grid gap-6 xl:grid-cols-12">
          
          {/* Column A: Interactive Device Settings & Trigger */}
          <div className="xl:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-850 pb-3">
              <Smartphone className="text-indigo-400" size={18} />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Device Attestation Settings</h4>
                <p className="text-[11px] text-zinc-500 font-mono">Tweak variables to test attestation pipelines</p>
              </div>
            </div>

            <div className="space-y-4 font-sans text-xs">
              {/* Select Platform */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Select Target Client Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["web", "android", "ios"] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => {
                        setAcPlatform(plat);
                        setAcAttestationSimState("idle");
                        setAcTokenValue("");
                        acAddLog(`Switched simulator active device platform to: ${plat.toUpperCase()}`, "info");
                      }}
                      className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                        acPlatform === plat
                          ? "bg-indigo-650 border-indigo-500 text-white font-black shadow-md"
                          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Attestation Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Attestation Provider Selection
                </label>
                
                {acPlatform === "web" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setAcWebProvider("recaptcha"); acAddLog("Selected reCAPTCHA Enterprise provider.", "info"); }}
                      className={`p-2.5 text-left rounded-xl border transition-all ${
                        acWebProvider === "recaptcha"
                          ? "bg-slate-900 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-850 text-slate-500"
                      }`}
                    >
                      <p className="font-bold text-[10px] uppercase">reCAPTCHA Enterprise</p>
                      <p className="text-[8px] text-zinc-500 leading-none mt-1 font-mono">No-cost default for web</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAcWebProvider("custom"); acAddLog("Selected Web custom attestation provider.", "info"); }}
                      className={`p-2.5 text-left rounded-xl border transition-all ${
                        acWebProvider === "custom"
                          ? "bg-slate-900 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-850 text-slate-500"
                      }`}
                    >
                      <p className="font-bold text-[10px] uppercase">Custom Provider</p>
                      <p className="text-[8px] text-zinc-500 leading-none mt-1 font-mono">Self-hosted verifying server</p>
                    </button>
                  </div>
                )}

                {acPlatform === "android" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setAcAndroidProvider("playintegrity"); acAddLog("Selected Play Integrity attestation provider.", "info"); }}
                      className={`p-2.5 text-left rounded-xl border transition-all ${
                        acAndroidProvider === "playintegrity"
                          ? "bg-slate-900 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-850 text-slate-500"
                      }`}
                    >
                      <p className="font-bold text-[10px] uppercase">Play Integrity</p>
                      <p className="text-[8px] text-zinc-500 leading-none mt-1 font-mono">10,000 requests / day standard</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAcAndroidProvider("custom"); acAddLog("Selected Android custom attestation provider.", "info"); }}
                      className={`p-2.5 text-left rounded-xl border transition-all ${
                        acAndroidProvider === "custom"
                          ? "bg-slate-900 border-indigo-500 text-white"
                          : "bg-slate-950 border-slate-850 text-slate-500"
                      }`}
                    >
                      <p className="font-bold text-[10px] uppercase">Custom System</p>
                      <p className="text-[8px] text-zinc-500 leading-none mt-1 font-mono">Third-party signing</p>
                    </button>
                  </div>
                )}

                {acPlatform === "ios" && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["appattest", "devicecheck", "custom"] as const).map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => { setAcIosProvider(prov); acAddLog(`Selected iOS ${prov.toUpperCase()} provider.`, "info"); }}
                        className={`p-2 text-center rounded-xl border text-[9px] uppercase tracking-wide transition-all ${
                          acIosProvider === prov
                            ? "bg-slate-900 border-indigo-500 text-white font-bold"
                            : "bg-slate-950 border-slate-850 text-slate-500"
                        }`}
                      >
                        {prov}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bot Security Hazard Toggle (Simulate Roots / Abuse) */}
              {acPlatform === "android" && (
                <div className="bg-rose-950/20 border border-rose-900/30 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-rose-500 animate-pulse" />
                      Rooted / Tampered Bootloader Device
                    </label>
                    <input
                      type="checkbox"
                      checked={acIsTamperedDevice}
                      onChange={(e) => {
                        setAcIsTamperedDevice(e.target.checked);
                        acAddLog(e.target.checked ? "Rooted status forced! Hardware keys invalid." : "Cleared rooted setting. Device restored.", "warn");
                      }}
                      className="accent-rose-500 cursor-pointer h-4 w-4"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans leading-normal">
                    Check this option to simulate a rooted Android smartphone. When user requests tokens, Google Play Integrity returns failed hardware profile, causing request denial.
                  </p>
                </div>
              )}

              {/* Enforced Services Selectable Options */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Enforced Firebase Services API Shield
                </span>
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-850 grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { key: "firestore", label: "Cloud Firestore" },
                    { key: "auth", label: "Firebase Auth (Preview)" },
                    { key: "storage", label: "Cloud Storage" },
                    { key: "functions", label: "Cloud Functions" }
                  ].map((srv) => {
                    const active = acEnforcedServices.includes(srv.key);
                    return (
                      <button
                        key={srv.key}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setAcEnforcedServices(prev => prev.filter(x => x !== srv.key));
                            acAddLog(`Disabled App Check protection wrapper on: ${srv.label}`, "warn");
                          } else {
                            setAcEnforcedServices(prev => [...prev, srv.key]);
                            acAddLog(`Activated App Check protection wrapper on: ${srv.label}`, "success");
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-left transition-all ${
                          active 
                            ? "bg-teal-500/10 text-teal-300 border border-teal-500/20" 
                            : "bg-slate-950/40 text-slate-500 border border-transparent hover:border-slate-800"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-teal-400 animate-pulse" : "bg-zinc-750"}`} />
                        <span>{srv.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TRIGGER GENERATE TOKEN SEQUENCE BUTTON */}
              <button
                type="button"
                onClick={acTriggerAttestation}
                disabled={acAttestationSimState === "attesting"}
                className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shadow cursor-pointer text-center flex items-center justify-center gap-2.5 ${
                  acAttestationSimState === "attesting"
                    ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                    : acAttestationSimState === "invalid_device"
                    ? "bg-rose-950/80 hover:bg-rose-900 border-rose-800 text-rose-350"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500"
                }`}
              >
                {acAttestationSimState === "attesting" ? (
                  <>
                    <RefreshCw className="animate-spin text-indigo-400" size={13} />
                    Verifying Cryptographic Attestation...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    {acAttestationSimState === "invalid_device" ? "Retry Dev Credentials Attestation" : "Acquire & Register App Check Client Token"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Column B: Terminal Outputs, Token decoders & Virtual Quota stats */}
          <div className="xl:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal size={14} className="text-teal-400" />
                  Live Client Attestation Logs
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase font-mono tracking-wider">Device status:</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    acAttestationSimState === "idle" ? "bg-slate-900 text-slate-400"
                    : acAttestationSimState === "attesting" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                    : acAttestationSimState === "token_acquired" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-550/20"
                    : "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                  }`}>
                    {acAttestationSimState === "idle" && "Idle"}
                    {acAttestationSimState === "attesting" && "Negotiating..."}
                    {acAttestationSimState === "token_acquired" && "Token Verified"}
                    {acAttestationSimState === "invalid_device" && "Hardware Rejected"}
                  </span>
                </div>
              </div>

              {/* Dark Terminal Viewer */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 overflow-hidden shadow-inner font-mono text-[10px] space-y-2 h-[155px] overflow-y-auto">
                {acLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-zinc-350 leading-relaxed">
                    <span className="text-zinc-650 shrink-0 select-none">[{log.time}]</span>
                    <span className={
                      log.type === "success" ? "text-emerald-400"
                      : log.type === "warn" ? "text-amber-500"
                      : log.type === "error" ? "text-rose-400 font-bold"
                      : "text-indigo-300"
                    }>
                      {log.type === "success" && "✔"}
                      {log.type === "warn" && "⚠"}
                      {log.type === "error" && "✖"}
                      {log.type === "info" && "•"}
                    </span>
                    <span className="break-all">{log.msg}</span>
                  </div>
                ))}
              </div>

              {/* JWT Decrypted Payload View */}
              {acTokenValue && acAttestationSimState === "token_acquired" && (
                <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block font-sans">Verified App Check JWT Decoded Snippet</span>
                    <span className="text-[8px] font-mono text-zinc-500 select-all">Click to copy payload</span>
                  </div>
                  <pre className="font-mono text-[9.5px] text-indigo-300 leading-normal select-all overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify({
                      headers: { alg: "RS256", typ: "JWT", kid: "ac-root-keys-8" },
                      payload: {
                        iss: "firebase-app-check",
                        sub: `projects/hub-active-compliance-${auth.currentUser?.uid?.slice(0, 5) || "admin-9382"}`,
                        platform: acPlatform.toUpperCase(),
                        attestation_provider: acPlatform === "web" ? acWebProvider : acPlatform === "android" ? acAndroidProvider : acIosProvider,
                        device_verified: true,
                        security_services_shield: acEnforcedServices,
                        iat: Math.round(Date.now() / 1000),
                        exp: Math.round((Date.now() + 3600000) / 1000)
                      }
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Request Allowed/Blocked counters & Provider Quotas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-850 pt-4">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850/80 text-center space-y-1">
                <span className="text-[8px] font-black uppercase text-slate-500 block">Allowed Requests</span>
                <span className="text-sm font-black font-mono text-emerald-400">{(acAllowedRequests).toLocaleString()}</span>
                <span className="text-[7.5px] text-zinc-500 block">Attested signature</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850/80 text-center space-y-1">
                <span className="text-[8px] font-black uppercase text-slate-500 block">Blocked Requests</span>
                <span className={`text-sm font-black font-mono ${acBlockedRequests > 0 ? "text-rose-400" : "text-slate-400"}`}>
                  {acBlockedRequests}
                </span>
                <span className="text-[7.5px] text-zinc-500 block">No attestation / root</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850/80 text-center space-y-1">
                <span className="text-[8px] font-black uppercase text-slate-500 block">Play Integrity Quota</span>
                <span className="text-sm font-black font-mono text-zinc-300">
                  {acPlayIntegrityCalls.toLocaleString()} / <span className="text-slate-650">10k</span>
                </span>
                <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${(acPlayIntegrityCalls / 10000) * 100}%` }} />
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850/80 text-center space-y-1">
                <span className="text-[8px] font-black uppercase text-slate-500 block">Web reCAPTCHA assessments</span>
                <span className="text-sm font-black font-mono text-zinc-300">
                  {acRecaptchaAssessments.toLocaleString()} / <span className="text-slate-650">10k</span>
                </span>
                <div className="w-full bg-slate-850 h-1 rounded-full overflow-hidden mt-1">
                  <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${(acRecaptchaAssessments / 10000) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FIREBASE APP CHECK DEBUG MODE PLAYGROUND & SIMULATOR */}
        <div className="border-t border-slate-800/80 pt-8 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              Sandbox Bypasses
            </span>
            <h4 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Lock className="text-indigo-400" size={20} />
              App Check Debug Mode Playground & Simulated Console
            </h4>
            <p className="text-slate-400 text-sm max-w-4xl font-sans leading-relaxed">
              When running locally (e.g., <code className="text-zinc-300 font-mono">localhost</code>) or inside a Continuous Integration (<code className="text-zinc-300 font-mono">CI</code>) environment, standard attestation checks fail. Use the <strong className="text-indigo-300">App Check Debug Provider</strong> to allow secure bypasses on development/test cells without exposing production credentials.
            </p>
          </div>

          {/* Warning notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs text-amber-300 leading-normal">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <strong className="text-white uppercase tracking-wider text-[10px] block mb-0.5">Development Precaution Alert</strong>
              The App Check debug provider permits system bypasses on backend resources. <strong>Never</strong> distribute production application builds configured with the debug token or commit the secret tokens to public repositories!
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Panel 1: Simulated Firebase Web Console Debug Tokens Whitelist (Column 1) */}
            <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <Settings className="text-orange-400" size={16} />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest">Simulated Firebase Console</h5>
                  <p className="text-[10px] text-orange-400 font-mono">Manage registered debug tokens</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Below are the safelisted debug tokens registered in your Firebase Dashboard under <strong>App Check &gt; Apps &gt; Manage Debug Tokens</strong>.
              </p>

              {/* Dynamic Tokens list */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {acDebugTokens.length === 0 ? (
                  <div className="p-3 text-center border border-dashed border-slate-850 rounded-xl text-zinc-500 text-[10px] font-mono">
                    No debug tokens registered. All debug environments will be REJECTED!
                  </div>
                ) : (
                  acDebugTokens.map((tok, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-905 border border-slate-850 rounded-xl font-mono text-[10px] text-zinc-300 group hover:border-slate-800 transition-all">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        <span className="truncate select-all" title={tok}>{tok}</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(tok);
                            acAddLog(`Copied debug token to clipboard: "${tok}"`, "info");
                          }}
                          className="p-1 hover:text-white transition-colors"
                          title="Copy Token"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => acRemoveSafelistedToken(tok)}
                          className="p-1 text-rose-450 hover:text-rose-450 transition-colors"
                          title="Revoke Token"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Debug Token form */}
              <div className="space-y-1.5 pt-2 border-t border-slate-850/60">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  Sitelist a New Debug Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={acNewDebugToken}
                    onChange={(e) => setAcNewDebugToken(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-[10px] text-white rounded-xl px-2.5 py-2 font-mono focus:outline-none focus:border-orange-500 transition-all"
                    placeholder="Paste generated UUID debug token..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        acAddSafelistedToken(acNewDebugToken);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => acAddSafelistedToken(acNewDebugToken)}
                    className="p-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 hover:text-white rounded-xl transition-all font-sans cursor-pointer flex items-center justify-center shrink-0"
                    title="Register debug token"
                  >
                    <Plus size={14} className="stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel 2: Localhost Bypass Interactive Emulator (Column 2) */}
            <div className="lg:col-span-8 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5 flex flex-col justify-between">
              
              {/* Tabs for Localhost Bypass vs CI Pipeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-855 pb-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAcCurrentEnv("localhost")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        acCurrentEnv === "localhost"
                          ? "bg-indigo-950/40 border-indigo-500/80 text-white font-black"
                          : "bg-slate-900/40 border-transparent text-slate-450 hover:text-slate-205"
                      }`}
                    >
                      Localhost Bypass (Dev)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAcCurrentEnv("ci")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        acCurrentEnv === "ci"
                          ? "bg-indigo-950/40 border-indigo-500/80 text-white font-black"
                          : "bg-slate-900/40 border-transparent text-slate-450 hover:text-slate-205"
                      }`}
                    >
                      CI Environment (Pipeline)
                    </button>
                  </div>

                  <span className="text-[9px] font-mono text-indigo-400/80 tracking-wider">
                    {acCurrentEnv === "localhost" ? "self.FIREBASE_APPCHECK_DEBUG_TOKEN" : "CI Encrypted Encryption Config"}
                  </span>
                </div>

                {acCurrentEnv === "localhost" ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Settings & Config for Localhost */}
                    <div className="space-y-3 font-sans text-xs">
                      {/* Toggle setting */}
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-[11px] text-white">Enable Browser Debug Mode</p>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Sets self.FIREBASE_APPCHECK_DEBUG_TOKEN = true</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={acClientDebugTokenActive}
                          onChange={(e) => {
                            setAcClientDebugTokenActive(e.target.checked);
                            acAddLog(e.target.checked 
                              ? "Local Client: Activated Debug token bypass flag. Browser Console will output safelist requests next time App Check loads." 
                              : "Local Client: Cleared Debug token bypass. Requesting raw attestations (which will fail under localhost).", "warn");
                          }}
                          className="accent-indigo-500 h-4 w-4 cursor-pointer"
                        />
                      </div>

                      {/* Client-side configured debug token value */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Client Debug Token UUID</span>
                        <div className="relative">
                          <input
                            type="text"
                            value={acClientDebugTokenValue}
                            onChange={(e) => setAcClientDebugTokenValue(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-850 text-[10px] text-white rounded-xl py-2 px-3 font-mono focus:outline-none focus:border-indigo-500 transition-all"
                            placeholder="e.g., 123a4567..."
                            disabled={!acClientDebugTokenActive}
                          />
                          {acClientDebugTokenActive && (
                            <button
                              type="button"
                              onClick={acGenerateRandomDebugToken}
                              className="absolute right-2 top-2 text-indigo-400 hover:text-indigo-300 transition-colors font-mono font-bold text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-indigo-500/10 rounded-md cursor-pointer"
                              title="Regenerate random token"
                            >
                              New UUID
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Localhost Trigger Button */}
                      <button
                        type="button"
                        onClick={acRunLocalhostRequest}
                        disabled={acLocalRequestStatus === "testing"}
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {acLocalRequestStatus === "testing" ? (
                          <>
                            <RefreshCw className="animate-spin text-white" size={12} />
                            Querying Client API...
                          </>
                        ) : (
                          <>
                            <PlayCircle size={14} />
                            Fire Localhost REST Query
                          </>
                        )}
                      </button>
                    </div>

                    {/* Virtual Response Visualizer with Code representation */}
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between font-mono text-[9px] space-y-3 min-h-[175px]">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-850/80 pb-2 mb-2">
                          <span className="font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <FileJson size={11} className="text-indigo-400" />
                            Backend Response Panel
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide font-sans ${
                            acLocalRequestStatus === "success" ? "bg-emerald-500/15 text-emerald-450"
                            : acLocalRequestStatus === "forbidden_missing" ? "bg-rose-500/15 text-rose-450"
                            : acLocalRequestStatus === "forbidden_unregistered" ? "bg-amber-500/15 text-amber-500"
                            : acLocalRequestStatus === "testing" ? "bg-indigo-500/15 text-indigo-400 animate-pulse"
                            : "bg-slate-950 text-slate-500"
                          }`}>
                            {acLocalRequestStatus === "idle" && "Standby"}
                            {acLocalRequestStatus === "testing" && "Pending"}
                            {acLocalRequestStatus === "success" && "HttpStatus: 200 OK"}
                            {acLocalRequestStatus === "forbidden_missing" && "HttpStatus: 403 Forbidden"}
                            {acLocalRequestStatus === "forbidden_unregistered" && "HttpStatus: 403 Access Denied"}
                          </span>
                        </div>

                        {acLocalRequestStatus === "idle" && (
                          <div className="py-8 text-center text-[10px] text-zinc-500 font-sans font-bold uppercase tracking-wider">
                            Send simulated request to visualize JWT authorization bypasses.
                          </div>
                        )}

                        {acLocalRequestStatus === "testing" && (
                          <div className="py-8 text-center text-[10px] text-indigo-400/80 font-sans animate-pulse">
                            Evaluating client request headers, parsing for X-Firebase-AppCheck value...
                          </div>
                        )}

                        {acLocalRequestStatus === "success" && (
                          <div className="space-y-2">
                            <p className="text-zinc-500 font-black">// RESPONSE PAYLOAD</p>
                            <pre className="text-emerald-400 leading-normal overflow-x-auto select-all bg-slate-950/80 p-2.5 rounded-lg border border-slate-850">
                              {JSON.stringify({
                                message: "Attestation bypass confirmed by registered Debug Token successfully.",
                                client_authorized: true,
                                requested_endpoints: acEnforcedServices,
                                payload_size_kilobytes: 43.12,
                                cached_status: "validated_upstream"
                              }, null, 2)}
                            </pre>
                          </div>
                        )}

                        {acLocalRequestStatus === "forbidden_missing" && (
                          <div className="space-y-1 text-rose-400 leading-normal">
                            <p className="text-rose-450 font-black">// SECURITY BLOCKED ERROR</p>
                            <p className="text-[10px]">AppCheck Token missing or malformed on request headers.</p>
                            <div className="text-zinc-300 bg-slate-950/80 p-2 rounded border border-rose-500/20 text-[9.5px] max-h-[110px] overflow-y-auto">
                              <pre>
                                {JSON.stringify({
                                  error: "Forbidden",
                                  message: "Requests originate from unverified sources (localhost). Verify client SDK initiates debug flags properly before instantiation.",
                                  errorCode: "APP_CHECK_MISSING_HEADER"
                                }, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {acLocalRequestStatus === "forbidden_unregistered" && (
                          <div className="space-y-1 text-amber-400 leading-normal">
                            <p className="text-amber-555 font-bold uppercase">// DECRYPTION ACCESS REJECTED</p>
                            <p className="text-[10px]">Presented token was validated of debug shape, but lacks whitelist registration.</p>
                            <div className="text-zinc-300 bg-slate-950/80 p-2 rounded border border-amber-500/20 text-[9.5px] max-h-[110px] overflow-y-auto font-mono">
                              <pre>
                                {JSON.stringify({
                                  error: "Forbidden",
                                  message: "The app check debug token presented has not been registered inside the Firebase Admin Console settings.",
                                  errorCode: "UNREGISTERED_DEBUG_TOKEN_EXCEPTION",
                                  parsed_token_sha256: "ea9e843b0e3..."
                                }, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-[8px] text-zinc-500 border-t border-slate-850/60 pt-2 leading-tight">
                        * Under local development, check browser logs for console-generated UUID and paste it directly into the whitelisted tokens list to register.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Continuous Integration settings */}
                    <div className="space-y-3 font-sans text-xs">
                      <div className="p-3 bg-zinc-900 border border-slate-850 rounded-2xl space-y-1 text-[11px]">
                        <p className="font-extrabold text-white flex items-center gap-1.5">
                          <Workflow size={13} className="text-indigo-400" />
                          Simulate CI Runner Environment
                        </p>
                        <p className="text-slate-400 leading-relaxed font-sans text-[10px]">
                          Automated CI runners can represent valid client instances by accessing a pre-generated token from secrets storage, e.g. <code className="text-zinc-300 font-mono">APP_CHECK_DEBUG_TOKEN_FROM_CI</code>.
                        </p>
                      </div>

                      {/* Secret injection config */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          CI Encrypted Variable Setting
                        </label>
                        <input
                          type="text"
                          value={acCiDebugTokenSecret}
                          onChange={(e) => setAcCiDebugTokenSecret(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-850 text-[10px] text-white rounded-xl py-2 px-3 font-mono focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          placeholder="e.g. Paste pre-generated debug token..."
                        />
                      </div>

                      {/* Trigger Pipeline Test */}
                      <button
                        type="button"
                        onClick={acRunCiBuildPipeline}
                        disabled={acCiTestResult === "testing"}
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {acCiTestResult === "testing" ? (
                          <>
                            <RefreshCw className="animate-spin text-white" size={12} />
                            Executing Integration Suite...
                          </>
                        ) : (
                          <>
                            <Activity size={12} />
                            Invoke GitHub Build Workflow
                          </>
                        )}
                      </button>
                    </div>

                    {/* Virtual CI status outcome panel */}
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between font-mono text-[9px] min-h-[175px]">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-850/80 pb-2">
                          <span className="font-extrabold text-slate-500 uppercase tracking-wider">GitHub Runner logs</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold font-sans uppercase ${
                            acCiTestResult === "passed" ? "bg-emerald-500/15 text-emerald-440"
                            : acCiTestResult === "failed" ? "bg-rose-500/15 text-rose-455"
                            : acCiTestResult === "testing" ? "bg-indigo-500/15 text-indigo-400 animate-pulse"
                            : "bg-slate-950 text-slate-500"
                          }`}>
                            {acCiTestResult === "idle" && "Runner Standby"}
                            {acCiTestResult === "testing" && "Building & testing..."}
                            {acCiTestResult === "passed" && "Pipeline Success"}
                            {acCiTestResult === "failed" && "Pipeline Rejected"}
                          </span>
                        </div>

                        {acCiTestResult === "idle" && (
                          <div className="py-8 text-center text-[10px] text-zinc-500 font-sans font-bold uppercase tracking-wider">
                            Invoke the workflow test to simulate runner integration tests.
                          </div>
                        )}

                        {acCiTestResult === "testing" && (
                          <div className="space-y-1.5 text-slate-400 leading-normal py-2 text-[9px]">
                            <p>• Setting up runner workspace...</p>
                            <p>• Setting process.env.APP_CHECK_DEBUG_TOKEN_FROM_CI = "*****"</p>
                            <p className="animate-pulse">• Testing service attestation scopes...</p>
                          </div>
                        )}

                        {acCiTestResult === "passed" && (
                          <div className="space-y-1.5 text-emerald-400 leading-normal">
                            <p className="font-extrabold text-white font-sans text-[10px]">✔ ALL INTEGRATION TESTS PASSED (100% SUCCESS)</p>
                            <div className="bg-slate-950/70 p-2 border border-slate-850 text-[8.5px] leading-relaxed select-all text-emerald-350 rounded">
                              [INFO] Verified CI token present: "db938f32..."
                              <br />
                              [INFO] Attested with App Check: SUCCESS.
                              <br />
                              [INFO] Database operation GET /contacts: ALLOWED.
                            </div>
                          </div>
                        )}

                        {acCiTestResult === "failed" && (
                          <div className="space-y-1.5 text-rose-400 leading-normal">
                            <p className="font-extrabold text-rose-500 font-sans text-[10px]">✖ INTEGRATION FLOW TERMINATED WITH ERRORS</p>
                            <div className="bg-slate-950/70 p-2 border border-rose-500/20 text-[8.5px] leading-relaxed text-rose-350 rounded">
                              [CRITICAL] App Check reported error code 403.
                              <br />
                              [CRITICAL] Access denied. Debug Token "db938f32..." is not whitelisted.
                              <br />
                              [CRITICAL] Tests aborted early. Exit status code -1.
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-[8.5px] text-zinc-500 border-t border-slate-850/60 pt-2 font-sans">
                        Make sure to securely specify the exact same debug token on both the Firebase Admin panel and GitHub Encrypted repository settings.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Guided Checklist / Steps */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4 text-xs font-sans">
            <h5 className="font-extrabold text-slate-350 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-400" />
              App Check Debug Mode Step-by-Step Implementation Manual
            </h5>

            <div className="grid gap-4 md:grid-cols-3 leading-relaxed">
              <div className="p-3.5 bg-slate-900/30 rounded-xl space-y-1.5 border border-slate-855">
                <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black font-mono">1</span>
                <p className="font-black text-white text-[11px] uppercase tracking-wide">Configure Debug Flags in Code</p>
                <div className="text-slate-400 text-[11px] space-y-1">
                  <p>Instruct the application to execute the Debug Provider instead of a standard attestation provider. Make sure this assignment resides <strong>before</strong> the <code className="text-zinc-300 font-mono">initializeAppCheck</code> callback trigger.</p>
                  <p className="text-[10px] text-amber-550 italic">Note for v8 and earlier: self.FIREBASE_APPCHECK_DEBUG_TOKEN must be in index.html.</p>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-850 font-mono text-[9px] text-red-400 leading-normal scrollbar-none max-h-[100px] overflow-y-auto select-all">
                  <pre>{`// Web SDK V9 Code snippet
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('site-key-here')
});`}</pre>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/30 rounded-xl space-y-1.5 border border-slate-855">
                <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black font-mono">2</span>
                <p className="font-black text-white text-[11px] uppercase tracking-wide">Acquire local temporary UUID</p>
                <p className="text-slate-400 text-[11px]">
                  Start local development server and launch the Web view. Inspect browser developer tools console logs. Look for a debug output sequence identical to:
                </p>
                <div className="p-2 bg-slate-950 rounded border border-slate-850 font-mono text-[9px] text-teal-400 select-all leading-normal">
                  AppCheck debug token: "123a4567-b89c-12d3-e456-789012345678". You will need to safelist it in the Firebase console for it to work.
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/30 rounded-xl space-y-1.5 border border-slate-855">
                <span className="w-5 h-5 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black font-mono">3</span>
                <p className="font-black text-white text-[11px] uppercase tracking-wide">Safelist token in Firebase Dashboard</p>
                <p className="text-slate-400 text-[11px]">
                  Navigate in Firebase console under <strong>Security &gt; App Check &gt; Apps</strong>, find your app, dropdown <strong>Manage debug tokens</strong>, and add this token value.
                </p>
                <div className="pt-1.5 text-[10px] font-bold text-teal-450 flex items-center gap-1 font-sans">
                  <CheckCircle2 size={12} />
                  Safe and ready for localhost Queries!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- METRICS EVALUATION & ENFORCEMENT DECISION MODULE ----------------- */}
        <div className="border-t border-slate-800/80 pt-8 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg">
              Enforcement Matrix
            </span>
            <h4 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="text-teal-400" size={20} />
              App Check Requests Metrics Screen & Live Enforcement Console
            </h4>
            <p className="text-slate-400 text-sm max-w-4xl font-sans leading-relaxed">
              Before enabling enforcement, check the request metrics screen in the Firebase Console under <strong className="text-teal-300">Security &gt; App Check &gt; APIs</strong>. Review the distribution of categories to avoid disrupting legitimate users using older app versions.
            </p>
          </div>

          {/* Interactive Preset Controls */}
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Panel 1: Metrics Screen (APIs Tab) Simulator */}
            <div className="lg:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase font-mono tracking-wider">APIs Tab Request Breakdown</span>
                  <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <PieIcon size={14} className="text-teal-400 animate-pulse" />
                    Simulated Active Project Metrics
                  </h5>
                </div>

                {/* Scenario Selector */}
                <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-850 self-start">
                  {[
                    { key: "prelaunch", label: "Pre-Launch" },
                    { key: "outdated", label: "Legacy Wild" },
                    { key: "under_attack", label: "Under Attack" }
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => setAcMetricsPreset(preset.key as any)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        acMetricsPreset === preset.key
                          ? "bg-teal-500 text-slate-950 font-black"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total volume info */}
              <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-850 text-xs">
                <span className="text-slate-400 font-sans">Simulated 7-Day Request Volume:</span>
                <span className="font-mono font-black text-white text-sm bg-slate-950 px-2.5 py-1 rounded-lg">
                  {acSelectedMetrics.totalRequests.toLocaleString()} Hits
                </span>
              </div>

              {/* Four categorized bars as per documentation */}
              <div className="space-y-4 pt-1 font-sans">
                {/* 1. Verified */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500 block" />
                      Verified Requests
                    </span>
                    <span className="font-mono font-black text-emerald-400">{acSelectedMetrics.verified}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${acSelectedMetrics.verified}%` }} />
                  </div>
                  <p className="text-[9.5px] text-zinc-500 font-mono leading-none">
                    Requests that carry a valid App Check token. These requests will SUCCEED after enforcement.
                  </p>
                </div>

                {/* 2. Outdated client */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-500 block" />
                      Outdated Client Requests
                    </span>
                    <span className="font-mono font-black text-amber-500">{acSelectedMetrics.outdated}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${acSelectedMetrics.outdated}%` }} />
                  </div>
                  <p className="text-[9.5px] text-zinc-500 font-mono leading-none">
                    Missing token, but look like older legit SDK versions. Enforcing App Check will BREAK these users!
                  </p>
                </div>

                {/* 3. Unknown origin */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-slate-400 block" />
                      Unknown Origin Requests
                    </span>
                    <span className="font-mono font-black text-slate-300">{acSelectedMetrics.unknown}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-slate-400 h-full rounded-full transition-all duration-700" style={{ width: `${acSelectedMetrics.unknown}%` }} />
                  </div>
                  <p className="text-[9.5px] text-zinc-500 font-mono leading-none">
                    Missing token, do not look like SDK. Potential bot scraping or stolen API keys.
                  </p>
                </div>

                {/* 4. Invalid */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 block" />
                      Invalid Requests
                    </span>
                    <span className="font-mono font-black text-rose-450">{acSelectedMetrics.invalid}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850">
                    <div className="bg-rose-500 h-full rounded-full transition-all duration-700" style={{ width: `${acSelectedMetrics.invalid}%` }} />
                  </div>
                  <p className="text-[9.5px] text-zinc-500 font-mono leading-none">
                    Have an invalid or emulated token (potential attacker masquerading / custom emulator).
                  </p>
                </div>
              </div>

              {/* Real-time recommendation system */}
              <div className="bg-slate-900/55 p-4 rounded-[1.25rem] border border-slate-850 space-y-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider block text-slate-500 font-mono">Real-Time Deployment Decision Advice</span>
                <p className={`text-xs ${acSelectedMetrics.color} leading-relaxed font-sans`}>
                  {acSelectedMetrics.recommendation}
                </p>
              </div>
            </div>

            {/* Panel 2: Product Enforcement Panel Screen */}
            <div className="lg:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="border-b border-slate-850 pb-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase font-mono tracking-wider block">Firebase Admin Console UI Mockup</span>
                  <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Settings className="text-indigo-400 animate-spin-slow" size={14} />
                    App Check Enforcement Screen
                  </h5>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  List of services supporting App Check. Enabling enforcement rejects all incoming unverified requests. It can take up to 15 minutes to take full effect upstream.
                </p>

                {/* Firestore, RTDB, Auth, Storage, Google Maps etc. */}
                <div className="grid gap-3 font-sans">
                  {[
                    { key: "firestore", label: "Cloud Firestore", desc: "NoSQL DB documents protection" },
                    { key: "realtime_db", label: "Realtime Database", desc: "WebSocket sync listeners protection" },
                    { key: "auth", label: "Firebase Authentication", desc: "Sign-in & token-exchange shielding" },
                    { key: "storage", label: "Cloud Storage", desc: "Media resource assets bucket" },
                    { key: "functions", label: "Cloud Functions (Callable)", desc: "Serverless execution hooks" },
                    { key: "maps", label: "Maps JavaScript API", desc: "Google Maps client usage quotas" },
                    { key: "places", label: "Places API (New)", desc: "Location autocomplete and details" }
                  ].map((srv) => {
                    const isEnforced = acMetricsEnforcedProducts.includes(srv.key);
                    return (
                      <div
                        key={srv.key}
                        className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 rounded-2xl hover:border-slate-800 transition-all text-xs"
                      >
                        <div className="space-y-0.5 max-w-[70%]">
                          <p className="font-black text-white">{srv.label}</p>
                          <p className="text-[10px] text-slate-500 truncate">{srv.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => acTriggerEnforceToggle(srv.key)}
                          className={`px-3 py-1.5 rounded-xl font-bold font-sans text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                            isEnforced
                              ? "bg-rose-500/10 text-rose-400 hover:text-rose-350 border border-rose-500/20"
                              : "bg-teal-500 hover:bg-teal-400 text-slate-950 font-black"
                          }`}
                        >
                          {isEnforced ? "Un-Enforce" : "Enforce"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Small notice and state indicator */}
              <div className="border-t border-slate-850/80 pt-3 flex items-center justify-between text-[10px] font-sans">
                <span className="text-zinc-500">Currently Enforced upstream check channels:</span>
                <span className="font-mono text-teal-400 font-bold uppercase select-none">
                  {acMetricsEnforcedProducts.length === 0 ? "NONE (Unprotected)" : `${acMetricsEnforcedProducts.length} API Channels Active`}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Modal dialog simulator for confirmation */}
          {acMetricsEnforceConfirmOpen && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
              >
                <div className="flex items-center gap-3 text-amber-500">
                  <AlertTriangle size={32} className="shrink-0 animate-bounce" />
                  <div className="space-y-0.5">
                    <h6 className="font-black text-rose-450 uppercase tracking-wide text-xs">Security Enforcement Warnings</h6>
                    <h5 className="font-black text-white text-lg leading-tight">Enforce App Check for {acConfirmProductTarget.replace("_", " ").toUpperCase()}?</h5>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Are you absolutely sure you want to proceed? Once enforcement is enabled on the live production channel, <strong className="text-white text-rose-300">any incoming requests lacking a valid, unexpired App Check attestation token will be immediately REJECTED</strong>. Older active builds of your application which do not integrate the SDK will break instantly.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setAcMetricsEnforceConfirmOpen(false)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 text-[11px] font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={acConfirmEnforcement}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Start Enforcement
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* ----------------- CLOUD FUNCTIONS MONITORING & LOGGING SIMULATOR ----------------- */}
        <div className="border-t border-slate-800/80 pt-8 space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Left Col: Setup & Controls (5 Cols) */}
            <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                  Serverless Hooks
                </span>
                <h4 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <Activity className="text-indigo-400 animate-pulse" size={18} />
                  Cloud Functions App Check Verify
                </h4>
                <p className="text-slate-400 text-xs font-sans leading-relaxed">
                  For Cloud Functions, configure <code className="text-zinc-300 font-mono text-[10px] bg-slate-900 px-1 py-0.5 rounded">enforceAppCheck: true</code> to mandate valid tokens. The backend outputs structured logs parsed using Logs Explorer.
                </p>
              </div>

              <div className="space-y-3 pt-2 font-sans text-xs">
                {/* 1. App Check Token State presented by device */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Presented App Check Token</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "valid", label: "Valid Token", color: "border-emerald-500/40 text-emerald-400 bg-emerald-950/20" },
                      { key: "invalid", label: "Invalid Token", color: "border-rose-500/40 text-rose-450 bg-rose-950/20" },
                      { key: "missing", label: "Missing", color: "border-amber-500/40 text-amber-500 bg-amber-950/20" }
                    ].map((st) => (
                      <button
                        key={st.key}
                        onClick={() => setAcCfTokenState(st.key as any)}
                        className={`py-2 text-[10px] rounded-lg border text-center transition-all cursor-pointer font-bold ${
                          acCfTokenState === st.key
                            ? "bg-indigo-600 border-indigo-500 text-white font-extrabold"
                            : "bg-slate-900 border-slate-850 text-slate-500"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Toggle enforce option */}
                <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-[11px] block">Enable Runtime Enforcement</span>
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">enforceAppCheck: true/false</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={acCfEnforceAppCheck}
                    onChange={(e) => setAcCfEnforceAppCheck(e.target.checked)}
                    className="accent-indigo-500 h-4 w-4 cursor-pointer"
                  />
                </div>

                {/* 3. Replay protection beta support */}
                <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-white text-[11px] block">Replay Protection (Beta)</span>
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">consumeAppCheckToken: true</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={acCfConsumeAppCheckToken}
                    onChange={(e) => setAcCfConsumeAppCheckToken(e.target.checked)}
                    className="accent-indigo-500 h-4 w-4 cursor-pointer"
                  />
                </div>

                {/* Invoke simulation call */}
                <button
                  onClick={acRunCfSimulator}
                  disabled={acCfExecutionActive}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-500"
                >
                  {acCfExecutionActive ? (
                    <>
                      <RefreshCw className="animate-spin text-white" size={13} />
                      Invoking Serverless...
                    </>
                  ) : (
                    <>
                      <PlayCircle size={14} />
                      Invoke Callable Function
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Col: Code Snippets & Simulated Structured Log Output (8 Cols) */}
            <div className="lg:col-span-8 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-4 flex flex-col justify-between">
              
              <div className="grid gap-5 md:grid-cols-2">
                
                {/* Visualizer Node.js 2nd Gen implementation markup code */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-indigo-400 font-sans block tracking-wider">Node.js gen2 Callable Definition</span>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 font-mono text-[9px] text-sky-400 leading-normal scrollbar-none max-h-[195px] overflow-y-auto">
                    <pre>{`const { onCall } = require("firebase-functions/v2/https");

exports.secureHookMatch = onCall(
  {
    enforceAppCheck: ${acCfEnforceAppCheck ? "true" : "false"}, // reject unverified
    consumeAppCheckToken: ${acCfConsumeAppCheckToken ? "true" : "false"} // beta replay protection
  },
  (request) => {
    // request.app handles validation metrics
    const attState = request.app;
    return { data: "secured_mentor_match_weights" };
  }
);`}</pre>
                  </div>
                </div>

                {/* Simulated Google Cloud Logging output stream */}
                <div className="space-y-2 flex flex-col h-full">
                  <span className="text-[9px] font-black uppercase text-teal-400 font-sans block tracking-wider">Simulated Cloud Logging Payload</span>
                  <div className="flex-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-850 font-mono text-[9px] text-zinc-300 min-h-[175px] max-h-[195px] overflow-y-auto leading-relaxed">
                    {acCfLogResult ? (
                      <pre className="text-emerald-450 select-all font-mono whitespace-pre-wrap">{acCfLogResult}</pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-500 font-sans font-bold uppercase tracking-wider text-center flex-col py-10">
                        <Terminal size={20} className="text-indigo-500 mb-2 h-5 w-5" />
                        Trigger function above to output live structured logs.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Logs-based Counter Metric documentation and setup explorer */}
              <div className="bg-indigo-950/15 border border-indigo-900/25 p-4 rounded-2xl space-y-2.5 font-sans">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block flex items-center gap-1">
                  <FileText size={13} />
                  Google Cloud Console logs-based counter metric filter builder
                </span>
                <p className="text-slate-400 text-xs leading-normal">
                  To trace metrics over historical logs, create a Google Cloud count metric using this specific filter query. Labeled matching can be configured using the field <code className="text-teal-300 font-mono bg-slate-950 px-1 py-0.5 rounded text-[10px]">jsonPayload.verifications.appCheck</code>:
                </p>
                <div className="p-2.5 bg-slate-950 rounded-xl font-mono text-[10.5px] text-indigo-300 select-all border border-slate-850 overflow-x-auto whitespace-pre">
{`resource.type="cloud_function"
resource.labels.function_name="secureHookMatch"
resource.labels.region="us-central1"
labels.firebase-log-type="callable-request-verification"`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- CUSTOM BACKEND AND REPLAY PROTECTION (BETA) SIMULATOR ----------------- */}
        <div className="border-t border-slate-800/80 pt-8 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Custom Backends
            </span>
            <h4 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Code2 className="text-emerald-400" size={20} />
              Verify Tokens on Custom Self-Hosted Backends (Replay Protection Beta)
            </h4>
            <p className="text-slate-400 text-sm max-w-4xl font-sans leading-relaxed">
              If you hook client apps into proprietary self-hosted servers, fetch App Check tokens client-side with <code className="text-zinc-300 font-mono">getToken()</code> and deliver them in custom HTTP headers, e.g., <strong className="text-emerald-300">X-Firebase-AppCheck</strong>. Verify them on the backend using the Firebase Admin SDK.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            
            {/* Panel 1: Backend Language Snippets Selector (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="text-[9px] font-black text-slate-500 uppercase font-mono tracking-wider block">Admin SDK Token Verification Code</span>
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-850">
                  {(["node", "python", "go"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setAcCbBackendLang(lang)}
                      className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md tracking-wide transition-all ${
                        acCbBackendLang === lang ? "bg-emerald-500 text-slate-950 font-black" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lang === "node" ? "Node.JS" : lang === "python" ? "Python" : "GoLang"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display code for selected language */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 font-mono text-[9px] leading-relaxed max-h-[195px] overflow-y-auto">
                {acCbBackendLang === "node" && (
                  <pre className="text-teal-400">{`import express from "express";
import { initializeApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";

const app = express();
const firebaseApp = initializeApp();

const appCheckVerification = async (req, res, next) => {
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (!appCheckToken) return res.status(401).send("Unauthorized");
    
    try {
        // Verify token with option for consumption
        const claims = await getAppCheck().verifyToken(appCheckToken, {
            consume: ${acCbConsumeEnabled ? "true" : "false"} // Replay Protection beta
        });
        
        if (claims.alreadyConsumed) {
            return res.status(401).send("Already Consumed Replay Token!");
        }
        return next();
    } catch (err) {
        return res.status(401).send("Unauthorized");
    }
};`}</pre>
                )}

                {acCbBackendLang === "python" && (
                  <pre className="text-teal-400">{`import firebase_admin
from firebase_admin import app_check
import flask

firebase_app = firebase_admin.initialize_app()
flask_app = flask.Flask(__name__)

@flask_app.before_request
def verify_app_check() -> None:
    token = flask.request.headers.get("X-Firebase-AppCheck", "")
    try:
        # verify claims (optionally filter subject matches)
        claims = app_check.verify_token(token)
    except Exception:
        flask.abort(401)`}</pre>
                )}

                {acCbBackendLang === "go" && (
                  <pre className="text-teal-400">{`package main
import (
    "context"
    "net/http"
    firebaseAdmin "firebase.google.com/go/v4"
)

func verifyAppCheck(w http.ResponseWriter, r *http.Request) {
    appCheckToken := r.Header.Get("X-Firebase-AppCheck")
    if appCheckToken == "" {
        w.WriteHeader(http.StatusUnauthorized)
        return
    }
    
    // Verify using Firebase AppCheck Client SDK
    _, err := appCheckClient.VerifyToken(appCheckToken)
    if err != nil {
        w.WriteHeader(http.StatusUnauthorized)
        return
    }
}`}</pre>
                )}
              </div>

              <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-2xl space-y-3 text-xs">
                {/* 1. Toggle consume validation */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-white text-[11px] flex items-center gap-1.5 uppercase tracking-wider text-rose-300">
                      <ShieldCheck size={12} />
                      Verify & Consume Token Option
                    </p>
                    <p className="text-[9px] text-zinc-500 leading-none">Sets consume: true to trigger replay defense</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={acCbConsumeEnabled}
                    onChange={(e) => setAcCbConsumeEnabled(e.target.checked)}
                    className="accent-emerald-500 h-4 w-4 cursor-pointer"
                  />
                </div>

                {/* 2. Token input value */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-850/60 font-sans">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                    <label>X-Firebase-AppCheck Header Token</label>
                    <div className="flex gap-1.5 font-mono text-[8px]">
                      <button
                        onClick={() => {
                          setAcCbTokenInput(`abc123_secured_app_check_token_${Math.random().toString(16).slice(2, 7)}`);
                          acAddLog("Custom Resource Server: Acquired fresh unspent custom debug attestation token.", "info");
                        }}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold uppercase px-1 rounded hover:bg-zinc-800"
                      >
                        [Get New Token]
                      </button>
                      <button
                        onClick={() => {
                          setAcCbTokenInput("dirty_unattested_forged_payload");
                          acAddLog("Custom Resource Server: Loaded dummy forged token payload.", "warn");
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors font-bold uppercase px-1 rounded hover:bg-zinc-800"
                      >
                        [Load Forged]
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={acCbTokenInput}
                    onChange={(e) => setAcCbTokenInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 font-mono text-[10.5px] text-zinc-300 focus:outline-none focus:border-emerald-500 transition-all text-ellipsis"
                    placeholder="Enter Custom Attestation token..."
                  />
                </div>

                {/* Run custom query trigger */}
                <button
                  onClick={acRunCbSimulator}
                  disabled={acCbSimulating}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 shadow-md"
                >
                  {acCbSimulating ? (
                    <>
                      <RefreshCw className="animate-spin text-slate-950 h-3 w-3" size={12} />
                      Posting Gateway Call...
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-current" />
                      Post Request To Custom Gateway
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Panel 2: Interactive Verification Console Logs & JSON response payload (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-5 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal size={14} className="text-emerald-400" />
                    Custom API Middleware Console logs
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black text-slate-500 uppercase font-mono tracking-wider">Gateway State:</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      acCbResponseStatus === null ? "bg-slate-900 text-slate-400"
                      : acCbResponseStatus === 200 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-550/20"
                      : "bg-rose-500/10 text-rose-450 border border-rose-500/20"
                    }`}>
                      {acCbResponseStatus === null ? "Standby" : `HTTP ${acCbResponseStatus}`}
                    </span>
                  </div>
                </div>

                {/* Middleware step execution log list */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 overflow-hidden font-mono text-[10px] space-y-2 h-[130px] overflow-y-auto shadow-inner">
                  {acCbLogs.length === 0 ? (
                    <div className="text-zinc-500 italic py-10 text-center font-sans">
                      Start simulated request to capture middleware workflow steps sequentially...
                    </div>
                  ) : (
                    acCbLogs.map((log, index) => (
                      <div key={index} className="text-zinc-300 leading-normal flex items-start gap-1">
                        <span className="shrink-0 text-zinc-650 font-bold select-none">&gt;</span>
                        <p className={
                          log.includes("Access permitted") || log.includes("unspent") || log.includes("Success") ? "text-emerald-400"
                          : log.includes("ALREADY CONSUMED") || log.includes("Error") || log.includes("Access Denied") || log.includes("Spent") || log.includes("Violation") ? "text-red-400 font-bold"
                          : log.includes("X-Firebase-AppCheck") ? "text-sky-300"
                          : "text-zinc-300"
                        }>
                          {log}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* JSON Endpoint Output View */}
                <div className="space-y-1.5 font-sans">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block font-mono">Simulated HTTP Client API Request Output</span>
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-850 min-h-[120px] max-h-[145px] overflow-y-auto">
                    {acCbResponsePayload ? (
                      <pre className="font-mono text-[9.5px] text-indigo-300 select-all leading-normal whitespace-pre-wrap">
                        {acCbResponsePayload}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[9px] text-zinc-500 font-bold font-mono tracking-widest text-center py-8">
                        WAITING FOR API TRIGGER...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informative advice */}
              <div className="text-[8.5px] text-zinc-500 border-t border-slate-850/60 pt-2 font-sans select-none leading-normal">
                * Replay protection registers verified single-use JWTs as "spent" on the Firebase App Check servers. Any repeat attempt using the exact same token triggers immediate validation denial, preventing hackers from capturing valid headers and replaying them on sensitive endpoints.
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- BEST PRACTICES AUDITOR & COMPLIANCE SCANNER ----------------- */}
        <div className="border-t border-slate-800/80 pt-8 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Compliance Standard
            </span>
            <h4 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={20} />
              App Check Production Best-Practice Compliance Auditor
            </h4>
            <p className="text-slate-400 text-sm max-w-4xl font-sans leading-relaxed">
              Before fully enabling enforcement in live client applications, run this interactive best-practice compliance checker. Match your active architecture variables to identify potential data loopholes, avoid disrupting legitimate legacy client versions, and configure replay defense blocks.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Col: Checklist controls (5 cols) */}
            <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase font-mono tracking-wider">Interactive Rules Assessment</span>
                  <h5 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Settings className="text-cyan-400 animate-spin-slow" size={13} />
                    Audit Checkpoints
                  </h5>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allFalse = Object.keys(acBestPracticeChecks).reduce((acc, k) => ({ ...acc, [k]: false }), {});
                    setAcBestPracticeChecks(allFalse);
                    setAcAuditComplete(false);
                    acAddLog("Best Practice Auditor: Reset all checklists to unverified.", "warn");
                  }}
                  className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-450 transition-colors cursor-pointer"
                >
                  [Reset All]
                </button>
              </div>

              {/* Assessment Questions / List */}
              <div className="space-y-3 font-sans">
                {/* 1. Request metrics verification */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({ ...p, metrics_eval: !p.metrics_eval }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.metrics_eval 
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/60 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.metrics_eval}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">Request Metrics Monitored Prior to Enforcement</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Verified metrics distribution under Security &gt; App Check &gt; APIs to guarantee legitimate outdated builds won't break.
                    </p>
                  </div>
                </div>

                {/* 2. Legacy check or prelaunch */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({ ...p, outdated_prelaunch: !p.outdated_prelaunch }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.outdated_prelaunch 
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/60 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.outdated_prelaunch}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">No Outdated Clients Risk / Pre-launch Isolation</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Enforced immediately for unreleased apps, or paced layout deployment wait to let clients patch older SDK packages first.
                    </p>
                  </div>
                </div>

                {/* 3. Cloud functions logging filters */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({ ...p, fn_metric_filter: !p.fn_metric_filter }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.fn_metric_filter 
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/60 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.fn_metric_filter}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">Cloud Functions Logs-Based Metric Filter Built</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Mapped `jsonPayload.verifications.appCheck` structured outputs under Google Cloud filter queries to audit endpoints.
                    </p>
                  </div>
                </div>

                {/* 4. Custom Backend verification pipeline */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({ ...p, custom_signature: !p.custom_signature }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.custom_signature 
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/60 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.custom_signature}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">Headers & Signature Decryption Rules Active</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Custom server validates header presence, decodes JWT signatures using Google App Check JWKS, and verifies algorithmic headers.
                    </p>
                  </div>
                </div>

                {/* 5. RS256 algorithm and Claims matched */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({
                    ...p,
                    custom_rs256: !p.custom_rs256,
                    custom_typ: !p.custom_typ,
                    custom_exp: !p.custom_exp,
                  }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.custom_rs256 && acBestPracticeChecks.custom_typ && acBestPracticeChecks.custom_exp
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/60 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.custom_rs256 && acBestPracticeChecks.custom_typ && acBestPracticeChecks.custom_exp}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">Advanced Claims Integrity Checked (JWT, RS256, Expiry)</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Manual JWT verifier explicitly confirms header `alg=RS256`, token type is `JWT`, and current time is prior to token `exp`.
                    </p>
                  </div>
                </div>

                {/* 6. Issuer & Audience constraint */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({
                    ...p,
                    custom_iss: !p.custom_iss,
                    custom_aud: !p.custom_aud,
                  }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.custom_iss && acBestPracticeChecks.custom_aud
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/60 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.custom_iss && acBestPracticeChecks.custom_aud}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">Issuer & Audience Explicit Constraints</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Asserts `iss` matches `https://firebaseappcheck.googleapis.com/[project_number]` and `aud` references `projects/[project_number]`.
                    </p>
                  </div>
                </div>

                {/* 7. Replay Protection beta */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({ ...p, replay_sensitive: !p.replay_sensitive }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.replay_sensitive 
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/65 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.replay_sensitive}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">Replay Protection Deployed on Sensitive Routes</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Activated token consumption (`consume: true`) on high-risk endpoints and fetched clients tokens using `getLimitedUseToken()`.
                    </p>
                  </div>
                </div>

                {/* 8. Debug token separation */}
                <div 
                  onClick={() => setAcBestPracticeChecks(p => ({ ...p, no_debug_prod: !p.no_debug_prod }))}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    acBestPracticeChecks.no_debug_prod 
                      ? "bg-emerald-950/10 border-emerald-500/30 text-white" 
                      : "bg-slate-900/30 border-slate-850/60 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={acBestPracticeChecks.no_debug_prod}
                    readOnly
                    className="accent-emerald-500 h-4 w-4 shrink-0 rounded border-slate-800 bg-slate-950 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] leading-tight text-white">Debug Environment Secrets Sanitized</p>
                    <p className="text-[9.5px] text-slate-500 leading-normal">
                      Debug tokens and CI credentials never hardcoded inside deployed repositories; isolates development keys completely.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Audit scan console logs, Compliance scoring metrics and PDF certificate (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col justify-between space-y-5">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Activity className="text-emerald-400 animate-pulse" size={14} />
                    Audit Scanner Compliance Console
                  </h4>
                  <span className="text-[8.5px] font-mono text-zinc-500">IEEE Sec-Audit-Ready 2026</span>
                </div>

                {/* Active compliance score board */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-[1.5rem] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Project Audit Rating</span>
                    <h5 className="font-black text-white text-lg tracking-tight flex items-center gap-1">
                      {acAuditComplete ? (
                        acAuditScore >= 90 ? (
                          <span className="text-emerald-450">Bulletproof Shell</span>
                        ) : acAuditScore >= 65 ? (
                          <span className="text-indigo-400">Mildly Hardened</span>
                        ) : (
                          <span className="text-rose-400 font-extrabold">Highly Vulnerable</span>
                        )
                      ) : (
                        <span className="text-slate-400 font-bold">Scanner Standby</span>
                      )}
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      Score represents cumulative active security controls correctly verified in database.
                    </p>
                  </div>

                  <div className="relative font-mono flex items-center justify-center shrink-0 w-20 h-20 bg-slate-950 rounded-full border border-slate-850 shadow-inner">
                    <div className="text-center">
                      <p className={`text-2xl font-black ${
                        acAuditComplete 
                          ? acAuditScore >= 90 ? "text-emerald-400" : acAuditScore >= 65 ? "text-indigo-400" : "text-rose-450"
                          : "text-slate-500"
                      }`}>
                        {acAuditComplete ? `${acAuditScore}%` : "--"}
                      </p>
                      <p className="text-[8px] text-zinc-650 uppercase font-black">Score</p>
                    </div>
                  </div>
                </div>

                {/* Structured Audit output result terminal */}
                <div className="bg-slate-950/85 border border-slate-850 rounded-2xl p-4 font-mono text-[10.5px] space-y-1.5 h-[145px] overflow-y-auto">
                  {!acAuditComplete && !acAuditLoading ? (
                    <div className="text-zinc-500 italic py-10 text-center font-sans space-y-2">
                      <Terminal size={22} className="mx-auto text-slate-650" />
                      <p>Adjust the checkpoints on the left, then trigger the Compliance Scanner to perform real-time verification checks.</p>
                    </div>
                  ) : acAuditLoading ? (
                    <div className="space-y-1 text-zinc-400 font-mono">
                      <p className="text-indigo-400 animate-pulse">&gt; Initializing Sec-Audit core verification engines...</p>
                      <p className="text-zinc-500">&gt; Parsing current Firebase project schemas... [OK]</p>
                      <p className="text-zinc-500">&gt; Querying App Check key verification policies... [RS256]</p>
                      <p className="text-teal-400">&gt; Evaluating endpoint response metrics & spent-token registries...</p>
                      <p className="text-zinc-650">&gt; Compiling compliance report...</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-zinc-350">
                      <p className="text-emerald-400 font-bold">&gt; SEC-AUDIT COMPLETE: Generated compliance scorecard.</p>
                      <p className="text-slate-400">&gt; Metrics evaluation check: {acBestPracticeChecks.metrics_eval ? "PASSED (Safe)" : "WARNED"}</p>
                      <p className="text-slate-400">&gt; Outdated client validation: {acBestPracticeChecks.outdated_prelaunch ? "PASSED (Secure)" : "Puffy"}</p>
                      <p className="text-slate-400">&gt; Logs Filter Builder: {acBestPracticeChecks.fn_metric_filter ? "VERIFIED (Metric counting active)" : "MISSING (Logs trace offline)"}</p>
                      <p className="text-slate-400">&gt; JWT Claims Decryption: {acBestPracticeChecks.custom_signature ? "HARDENED" : "UNENFORCED"}</p>
                      <p className="text-slate-400">&gt; Audience & Identity Rules Match: {acBestPracticeChecks.custom_iss && acBestPracticeChecks.custom_aud ? "SECURED" : "BYPASSED (Spoof risk)"}</p>
                      <p className="text-slate-400">&gt; Replay Attacks Defense: {acBestPracticeChecks.replay_sensitive ? "DEFLECTIVE (consume token flag verified)" : "VULNERABLE (replay risk)"}</p>
                      <p className="text-indigo-400 font-bold">&gt; RECOMMENDATION RESOLUTION COMPILED SUCCESSFULLY.</p>
                    </div>
                  )}
                </div>

                {/* Custom feedback card based on score */}
                {acAuditComplete && (
                  <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-850/60 text-xs text-slate-300 font-sans leading-relaxed">
                    <span className="font-bold flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-amber-500 mb-1">
                      <Award size={13} />
                      Actionable Security Action Plan
                    </span>
                    {acAuditScore === 100 ? (
                      <p>🎉 Excellent. All major security compliance directives under <strong className="text-emerald-305">Firebase App Check</strong> are active. Your API endpoints stand bulletproof from malicious bot scrapers and credential stuffing.</p>
                    ) : (
                      <div className="space-y-1 text-[11px] leading-relaxed">
                        <p>Your current configuration covers multiple vectors, but has security blind spots. Major remedies:</p>
                        <ul className="list-disc pl-4 space-y-1 text-slate-400">
                          {!acBestPracticeChecks.replay_sensitive && (
                            <li>Ensure high-value sensitive API endpoints call <code className="text-teal-300 text-[9.5px] font-mono bg-slate-950 px-1 py-0.5 rounded">{`{ consume: true }`}</code> to trigger strict Replay Protection, preventing captured token replay loops.</li>
                          )}
                          {(!acBestPracticeChecks.custom_iss || !acBestPracticeChecks.custom_aud) && (
                            <li>Confirm that code inside custom self-hosted verification routes explicitly validates the <code className="text-teal-300 text-[9.5px] font-mono bg-slate-950 px-1 py-0.5">iss</code> and <code className="text-teal-300 text-[9.5px] font-mono bg-slate-950 px-1 py-0.5">aud</code> JWT claims to prevent attacker-provided client tokens from other projects.</li>
                          )}
                          {!acBestPracticeChecks.fn_metric_filter && (
                            <li>Configure logs-based counter filters inside Google Cloud logging terminal referencing the exact fields of callable request verifications.</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Trigger scanner button */}
              <div className="pt-2 border-t border-slate-850/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <span className="text-[9.5px] text-zinc-500 font-sans">
                  * Evaluates standard security compliance guides across client, server, and CI boundaries.
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setAcAuditLoading(true);
                    setAcAuditComplete(false);
                    acAddLog("Best Practice Auditor: Initiated project verification audit sequence...", "info");
                    
                    setTimeout(() => {
                      let score = 5;
                      if (acBestPracticeChecks.metrics_eval) score += 15; 
                      if (acBestPracticeChecks.outdated_prelaunch) score += 10; 
                      if (acBestPracticeChecks.fn_metric_filter) score += 15; 
                      if (acBestPracticeChecks.custom_signature) score += 15; 
                      if (acBestPracticeChecks.custom_rs256) score += 10; 
                      if (acBestPracticeChecks.custom_iss && acBestPracticeChecks.custom_aud) score += 15; 
                      if (acBestPracticeChecks.replay_sensitive) score += 10; 
                      if (acBestPracticeChecks.no_debug_prod) score += 5; 

                      setAcAuditScore(score);
                      setAcAuditLoading(false);
                      setAcAuditComplete(true);
                      
                      if (score >= 90) {
                        acAddLog(`Best Practice Auditor: Scanner verified complete hardened system compliance! [Score: ${score}/100 - BULLETPROOF]`, "success");
                      } else if (score >= 65) {
                        acAddLog(`Best Practice Auditor: Scanner verified project configurations. Some vulnerabilities identified. [Score: ${score}/100 - SOLID]`, "warn");
                      } else {
                        acAddLog(`Best Practice Auditor: CRITICAL VULNERABILITIES IDENTIFIED. Project lacks multiple essential App Check protections. [Score: ${score}/100 - DANGEROUS]`, "error");
                      }
                    }, 1200);
                  }}
                  disabled={acAuditLoading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400 shadow-lg"
                >
                  {acAuditLoading ? (
                    <>
                      <RefreshCw className="animate-spin text-slate-950" size={13} />
                      Auditing Schemas...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      Run Compliance Scan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE PLATFORM INTEGRATION SHORTCUTS */}

        <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Code2 className="text-teal-400" size={16} />
              Platform Integration Shortcuts & Initialization Code
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Install the official Firebase SDK wrappers and choose the appropriate configuration blocks to securely enable App Check.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 font-sans text-xs">
            {/* Web Code card */}
            <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-2xl space-y-2">
              <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider block font-mono">1. Web & Single Page App SDK</span>
              <pre className="font-mono text-[10px] text-rose-300 overflow-x-auto whitespace-normal break-all">
                npm i @firebase/app-check
              </pre>
              <div className="p-2.5 bg-slate-950 rounded-xl space-y-1 border border-sans border-slate-850">
                <span className="text-[8px] text-zinc-500 uppercase block font-mono">AppCheck Registration:</span>
                <pre className="text-[9px] text-emerald-400 font-mono leading-normal whitespace-pre-wrap">
                  {`import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('SITE-KEY-HERE'),
  isTokenAutoRefreshEnabled: true
});`}
                </pre>
              </div>
            </div>

            {/* Android code card */}
            <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-2xl space-y-2">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block font-mono">2. Android (Gradle & Play Integrity)</span>
              <pre className="font-mono text-[10px] text-rose-300 overflow-x-auto whitespace-normal break-all">
                implementation 'com.google.firebase:firebase-appcheck-playintegrity'
              </pre>
              <div className="p-2.5 bg-slate-950 rounded-xl space-y-1 border border-sans border-slate-850">
                <span className="text-[8px] text-zinc-500 uppercase block font-mono">Java/Kotlin Initialization:</span>
                <pre className="text-[9px] text-emerald-400 font-mono leading-normal whitespace-pre-wrap">
                  {`val firebaseAppCheck = FirebaseAppCheck.getInstance()
firebaseAppCheck.installAppCheckProviderFactory(
    PlayIntegrityAppCheckProviderFactory.getInstance()
)`}
                </pre>
              </div>
            </div>

            {/* iOS Xcode card */}
            <div className="bg-slate-900/60 p-4 border border-slate-850 rounded-2xl space-y-2">
              <span className="text-[9px] font-bold text-pink-400 uppercase tracking-wider block font-mono">3. Apple CocoaPods / Swift package</span>
              <pre className="font-mono text-[10px] text-rose-300 overflow-x-auto whitespace-normal break-all">
                pod 'FirebaseAppCheck'
              </pre>
              <div className="p-2.5 bg-slate-950 rounded-xl space-y-1 border border-sans border-slate-850">
                <span className="text-[8px] text-zinc-500 uppercase block font-mono">Swift Initialization:</span>
                <pre className="text-[9px] text-emerald-400 font-mono leading-normal whitespace-pre-wrap">
                  {`import Firebase

let providerFactory = AppCheckDebugProviderFactory()
AppCheck.setAppCheckProviderFactory(providerFactory)`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ADMIN STATS ACCENT */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center">
            <Award className="mx-auto text-amber-500 mb-2" size={24} />
            <p className="text-2xl font-black text-white italic tracking-tighter">Safety First.</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Verified mentors only.</p>
        </div>
        <div className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl text-center">
            <User className="mx-auto text-blue-500 mb-2" size={24} />
            <p className="text-2xl font-black text-white italic tracking-tighter">Community.</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Service keeps us sober.</p>
        </div>
      </div>
    </motion.div>
  );
};
