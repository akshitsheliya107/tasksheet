import { useState, useEffect, useRef } from "react";
import { 
  Eye, EyeOff, Save, RefreshCw, Plus, Trash2, GripVertical,
  CheckCircle, XCircle, ExternalLink, HelpCircle, ChevronUp, ChevronDown,
  Settings as SettingsIcon, Link as LinkIcon, Key, Users, User
} from "lucide-react";
import { Input, Select, Switch, Button, Popconfirm, Collapse, message, Modal } from "antd";
import toast from "react-hot-toast";
import { clickupConfigAPI, clickupSyncAPI } from "../services/api";
import { DEFAULT_CLICKUP_LIST_MAPPING } from "../data";
import LoadingSpinner from "./LoadingSpinner";

// Dark mode style overrides for Ant Design components
const darkModeStyles = `
  .dark .cu-input.ant-input,
  .dark .cu-input .ant-input,
  .dark .cu-input.ant-input-affix-wrapper {
    background-color: #000000 !important;
    border-color: #404040 !important;
    color: #ffffff !important;
  }
  .dark .cu-input.ant-input-affix-wrapper > input.ant-input {
    background-color: #000000 !important;
    color: #ffffff !important;
  }
  .dark .cu-input.ant-input::placeholder,
  .dark .cu-input .ant-input::placeholder {
    color: #525252 !important;
  }
  .dark .cu-input .ant-input-password-icon {
    color: #737373 !important;
  }
  .dark .cu-select .ant-select-selector {
    background-color: #000000 !important;
    border-color: #404040 !important;
  }
  .dark .cu-select .ant-select-selection-item {
    color: #ffffff !important;
  }
  .dark .cu-select .ant-select-selection-placeholder {
    color: #525252 !important;
  }
  .dark .cu-select .ant-select-arrow {
    color: #737373 !important;
  }
  .dark .ant-select-dropdown {
    background-color: #0a0a0a !important;
    border: 1px solid #404040 !important;
  }
  .dark .ant-select-item {
    color: #e5e5e5 !important;
  }
  .dark .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: #171717 !important;
  }
  .dark .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: #064e3b !important;
    color: #ffffff !important;
  }
  .dark .ant-collapse-header {
    color: #ffffff !important;
  }
  .dark .ant-collapse-content {
    background-color: transparent !important;
    color: #d4d4d4 !important;
  }
  .dark .ant-collapse-content-box {
    color: #d4d4d4 !important;
  }
  .dark .ant-popconfirm .ant-popover-inner {
    background-color: #171717 !important;
  }
  .dark .ant-popconfirm-title,
  .dark .ant-popconfirm-description {
    color: #e5e5e5 !important;
  }
`;

export default function ClickupSettings({ typeOptions = [] }) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingLinks, setTestingLinks] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const reportNameRef = useRef(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (config && !config.reportName && reportNameRef.current) {
      setTimeout(() => {
        if (reportNameRef.current && reportNameRef.current.input) {
          reportNameRef.current.focus();
          reportNameRef.current.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [config]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await clickupConfigAPI.get();
      setConfig(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ClickUp settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      const updated = await clickupConfigAPI.update({
        apiToken: config.apiToken,
        teamId: config.teamId,
        userId: config.userId,
        reportName: config.reportName,
      });
      setConfig(updated);
      toast.success("Credentials saved");
    } catch (error) {
      toast.error("Failed to save credentials");
    }
  };

  const handleSaveCustomFields = async () => {
    try {
      const updated = await clickupConfigAPI.update({
        panelCustomFieldName: config.panelCustomFieldName,
        bugTypeCustomFieldName: config.bugTypeCustomFieldName,
      });
      setConfig(updated);
      toast.success("Custom fields saved");
    } catch (error) {
      toast.error("Failed to save custom fields");
    }
  };

  const handleSaveSectionLinks = async () => {
    try {
      const updated = await clickupConfigAPI.update({
        discussionLink: config.discussionLink,
        mrIssueLink: config.mrIssueLink,
        testingLink: config.testingLink,
      });
      setConfig(updated);
      toast.success("Section links saved");
    } catch (error) {
      toast.error("Failed to save section links");
    }
  };

  const handleTestLinks = async () => {
    const extractId = (url) => {
      if (!url) return null;
      const pathPart = url.split('?')[0];
      const parts = pathPart.split('/').filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : null;
    };
    
    const taskIds = [
      extractId(config.discussionLink),
      extractId(config.mrIssueLink),
      extractId(config.testingLink)
    ];
    
    if (taskIds.every(id => !id)) {
      toast.error("No valid links provided to test");
      return;
    }
    
    setTestingLinks(true);
    const res = await clickupSyncAPI.testLinks(taskIds);
    setTestingLinks(false);
    
    if (res.success) {
      setTestResult(res.results);
      setTestModalVisible(true);
    } else {
      toast.error(res.error || "Failed to test links");
    }
  };

  const handleAddRule = async () => {
    try {
      const newRule = await clickupConfigAPI.addMappingRule({
        pattern: "",
        matchType: "contains",
        type: typeOptions.length > 0 ? typeOptions[0].name : "Internal Bug",
        statusSource: "main_status",
        bugTypeSource: "none",
        enabled: true,
      });
      setConfig((prev) => ({
        ...prev,
        listMapping: [...prev.listMapping, newRule],
      }));
      toast.success("Rule added");
    } catch (error) {
      toast.error("Failed to add rule");
    }
  };

  const handleUpdateRule = (id, field, value) => {
    setConfig((prev) => ({
      ...prev,
      listMapping: prev.listMapping.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    }));
  };

  const handleSaveRules = async () => {
    try {
      const updated = await clickupConfigAPI.update({
        listMapping: config.listMapping,
      });
      setConfig(updated);
      toast.success("Mapping rules saved");
    } catch (error) {
      toast.error("Failed to save rules");
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await clickupConfigAPI.deleteMappingRule(id);
      setConfig((prev) => ({
        ...prev,
        listMapping: prev.listMapping.filter((r) => r.id !== id),
      }));
      toast.success("Rule deleted");
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleMoveRule = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === config.listMapping.length - 1)
    ) {
      return;
    }
    const newList = [...config.listMapping];
    const temp = newList[index];
    newList[index] = newList[index + direction];
    newList[index + direction] = temp;
    setConfig((prev) => ({ ...prev, listMapping: newList }));
  };

  const handleResetMapping = async () => {
    try {
      const updated = await clickupConfigAPI.resetMapping();
      setConfig(updated);
      toast.success("Rules reset to default");
    } catch (error) {
      toast.error("Failed to reset rules");
    }
  };

  const handleLoadTeams = async () => {
    if (!config.apiToken) {
      toast.error("Please enter API token first");
      return;
    }

    setLoadingTeams(true);
    setAvailableTeams([]);

    try {
      const result = await clickupSyncAPI.listTeams(config.apiToken);

      if (result.success) {
        setAvailableTeams(result.teams || []);
        
        // Auto-fill user ID
        if (result.user?.id && !config.userId) {
          setConfig(prev => ({ ...prev, userId: String(result.user.id) }));
          toast.success("User ID auto-filled");
        }

        // Auto-select if only one team
        if (result.teams?.length === 1) {
          const team = result.teams[0];
          setConfig(prev => ({ ...prev, teamId: team.id }));
          toast.success(`Team auto-selected: ${team.name}`);
        } else if (result.teams?.length > 1) {
          toast.success(`Found ${result.teams.length} teams. Please select one.`);
        } else {
          toast.error("No teams found for this account");
        }
      } else {
        toast.error(result.error || "Failed to load teams");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.apiToken) {
      toast.error("Please enter API token first");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await clickupSyncAPI.testConnection(
        config.apiToken,
        config.teamId
      );

      setTestResult(result);

      if (result.success) {
        toast.success(
          `✅ Connected as ${result.user.username || result.user.email}`,
          { duration: 4000 }
        );

        // Auto-fill user ID if not set
        if (result.user.id && !config.userId) {
          setConfig({ ...config, userId: String(result.user.id) });
          toast.success("User ID auto-filled");
        }

        // Show team info if available
        if (result.team) {
          toast.success(`Team: ${result.team.name}`, { duration: 3000 });
        }
      } else {
        toast.error(result.error || "Connection failed");
        
        // Show available teams if provided
        if (result.availableTeams && result.availableTeams.length > 0) {
          const teamsList = result.availableTeams
            .map(t => `${t.name} (${t.id})`)
            .join(", ");
          toast(`Available teams: ${teamsList}`, { 
            duration: 6000,
            icon: "ℹ️"
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to test connection");
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleResetAll = async () => {
    try {
      const resetConfig = await clickupConfigAPI.reset();
      setConfig(resetConfig);
      toast.success("Integration disconnected and reset");
    } catch (error) {
      toast.error("Failed to reset integration");
    }
  };

  if (loading || !config) return <LoadingSpinner message="Loading ClickUp Settings..." />;

  const selectOptions = typeOptions.map((opt) => ({
    label: opt.name,
    value: opt.name,
  }));

  const helpItems = [
    {
      key: '1',
      label: 'How to set up ClickUp integration',
      children: (
        <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Get your ClickUp Personal API Token from settings.</li>
          <li>Find your Team ID from the URL (app.clickup.com/&#123;TEAM_ID&#125;/...).</li>
          <li>Find your User ID.</li>
          <li>Configure list mapping rules below.</li>
          <li>Test connection to verify everything is working.</li>
          <li>Go to Dashboard → "Fetch from ClickUp" to pull tasks.</li>
        </ol>
      ),
    },
  ];

  return (
    <>
      <style>{darkModeStyles}</style>
      <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-12">
        {/* SECTION 1: HEADER */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
              <SettingsIcon className="text-emerald-600" />
              ClickUp Integration
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Connect ClickUp to auto-fetch your daily tasks
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {config.isConfigured ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                <CheckCircle size={14} />
                Connected
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700">
                <XCircle size={14} />
                Not Connected
              </div>
            )}
            {config.lastSyncedAt && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Last synced: {new Date(config.lastSyncedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

      {/* SECTION 2: API CREDENTIALS CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Key size={18} className="text-emerald-600" />
          API Credentials
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ClickUp API Token
            </label>
            <Input.Password
              value={config.apiToken}
              onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
              placeholder="pk_..."
              iconRender={(visible) => (visible ? <Eye size={16} /> : <EyeOff size={16} />)}
              className="cu-input"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Find your token at: ClickUp → Settings → Apps → API Token
              </span>
              <a 
                href="https://app.clickup.com/settings/apps" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Get your token here <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Users size={14} /> Team / Workspace
            </label>
            
            {availableTeams.length > 0 ? (
              <Select
                value={config.teamId || undefined}
                onChange={(val) => setConfig({ ...config, teamId: val })}
                placeholder="Select your team"
                className="w-full cu-select"
                options={availableTeams.map(t => ({
                  value: t.id,
                  label: `${t.name} (ID: ${t.id})`,
                }))}
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  value={config.teamId || ""}
                  onChange={(e) => setConfig({ ...config, teamId: e.target.value })}
                  placeholder="Click 'Load Teams' button →"
                  className="cu-input flex-1"
                  readOnly={!config.teamId}
                />
                <Button
                  type="primary"
                  onClick={handleLoadTeams}
                  loading={loadingTeams}
                  disabled={!config.apiToken}
                  icon={<RefreshCw size={14} />}
                  className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                >
                  {loadingTeams ? "Loading..." : "Load Teams"}
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {availableTeams.length > 0 
                  ? `${availableTeams.length} team${availableTeams.length !== 1 ? 's' : ''} available`
                  : "Click 'Load Teams' to fetch from ClickUp"}
              </span>
              {availableTeams.length > 0 && (
                <button 
                  onClick={handleLoadTeams}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  Reload teams
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <User size={14} /> User ID
              {config.userId && (
                <span className="ml-1 text-[10px] text-emerald-600 font-semibold">✓ AUTO</span>
              )}
            </label>
            <Input
              value={config.userId || ""}
              onChange={(e) => setConfig({ ...config, userId: e.target.value })}
              placeholder="Auto-fills when you load teams"
              className="cu-input"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Auto-detected from your API token (or enter manually)
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <User size={14} /> Report Name
            </label>
            <Input
              ref={reportNameRef}
              value={config.reportName || ""}
              onChange={(e) => setConfig({ ...config, reportName: e.target.value })}
              placeholder="e.g. Akshit Sheliya"
              className={`cu-input transition-all duration-300 ${!config.reportName ? '!border-blue-500 ring-4 ring-blue-500/30 animate-pulse shadow-md' : ''}`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Name to appear on the generated output report header
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="primary" onClick={handleSaveCredentials} icon={<Save size={16} />} className="bg-emerald-600">
            Save Credentials
          </Button>
          <Button 
            onClick={handleTestConnection} 
            icon={<LinkIcon size={16} />}
            loading={testing}
            disabled={!config.apiToken}
          >
            {testing ? "Testing..." : "Test Connection"}
          </Button>
          
          <div className="flex-1 text-right">
            <Popconfirm
              title="Disconnect ClickUp"
              description="This will clear all your ClickUp settings. Are you sure?"
              onConfirm={handleResetAll}
              okText="Yes, Disconnect"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
            >
              <Button danger type="text">Disconnect</Button>
            </Popconfirm>
          </div>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            testResult.success
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
          }`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle size={20} className="flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold mb-1">
                  {testResult.success ? "Connection Successful!" : "Connection Failed"}
                </p>
                {testResult.success && testResult.user && (
                  <div className="text-sm space-y-1">
                    <p>👤 <strong>User:</strong> {testResult.user.username || "N/A"}</p>
                    <p>📧 <strong>Email:</strong> {testResult.user.email || "N/A"}</p>
                    <p>🆔 <strong>User ID:</strong> {testResult.user.id}</p>
                    {testResult.team && (
                      <>
                        <p>🏢 <strong>Team:</strong> {testResult.team.name}</p>
                        <p>🆔 <strong>Team ID:</strong> {testResult.team.id}</p>
                      </>
                    )}
                  </div>
                )}
                {!testResult.success && (
                  <p className="text-sm">{testResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: CUSTOM FIELD NAMES CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Custom Field Names
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Panel Custom Field Name
            </label>
            <Input
              value={config.panelCustomFieldName}
              onChange={(e) => setConfig({ ...config, panelCustomFieldName: e.target.value })}
              className="cu-input"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              ClickUp custom field name used for Panel/Alpha bug status
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bug Type Custom Field Name
            </label>
            <Input
              value={config.bugTypeCustomFieldName}
              onChange={(e) => setConfig({ ...config, bugTypeCustomFieldName: e.target.value })}
              className="cu-input"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              ClickUp custom field name for bug type (New Feature, Revision, etc.🐞)
            </span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button onClick={handleSaveCustomFields} icon={<Save size={16} />}>
            Save Custom Fields
          </Button>
        </div>
      </div>

      {/* SECTION: SPECIAL SECTION LINKS CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Special Section Links (Auto-fill Time)
        </h3>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Discussion Task Link
            </label>
            <Input
              value={config.discussionLink || ""}
              onChange={(e) => setConfig({ ...config, discussionLink: e.target.value })}
              className="cu-input"
              placeholder="https://app.clickup.com/t/..."
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Time logged on this task will auto-fill the Discussion section.
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MR Issue Task Link
            </label>
            <Input
              value={config.mrIssueLink || ""}
              onChange={(e) => setConfig({ ...config, mrIssueLink: e.target.value })}
              className="cu-input"
              placeholder="https://app.clickup.com/t/..."
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Time logged on this task will auto-fill the MR Issue section.
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Testing Section Task Link
            </label>
            <Input
              value={config.testingLink || ""}
              onChange={(e) => setConfig({ ...config, testingLink: e.target.value })}
              className="cu-input"
              placeholder="https://app.clickup.com/t/..."
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              Time logged on this task will auto-fill the Testing section.
            </span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <Button onClick={handleSaveSectionLinks} icon={<Save size={16} />}>
            Save Section Links
          </Button>
          <Button 
            onClick={handleTestLinks} 
            loading={testingLinks}
            className="border-emerald-500 text-emerald-600 hover:text-emerald-700 dark:border-emerald-600 dark:text-emerald-500"
          >
            Test Links
          </Button>
        </div>
      </div>

      {/* SECTION 4: LIST MAPPING RULES CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              List Mapping Rules
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Rules are matched in order (top to bottom). First match wins.
            </p>
          </div>
          <div className="flex gap-2">
            <Popconfirm
              title="Reset to defaults"
              description="Are you sure you want to reset all rules to default?"
              onConfirm={handleResetMapping}
              okText="Reset"
              cancelText="Cancel"
            >
              <Button icon={<RefreshCw size={14} />}>Reset Defaults</Button>
            </Popconfirm>
            <Button type="primary" onClick={handleSaveRules} className="bg-emerald-600" icon={<Save size={14} />}>
              Save Rules
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <div className="min-w-[1100px] space-y-2">
            {/* Header Row */}
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800">
              <div className="w-12 text-center flex-shrink-0">Order</div>
              <div className="w-14 text-center flex-shrink-0">Active</div>
              <div className="flex-1 min-w-[140px]">List Pattern</div>
              <div className="w-32 flex-shrink-0">Match Type</div>
              <div className="w-40 flex-shrink-0">Task Type</div>
              <div className="w-36 flex-shrink-0">Status Source</div>
              <div className="w-36 flex-shrink-0">Bug Type Source</div>
              <div className="w-10 text-center flex-shrink-0">Del</div>
            </div>

            {/* Rule Rows */}
            {config.listMapping.map((rule, index) => (
              <div
                key={rule.id}
                className={`flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-neutral-950 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 transition-all ${!rule.enabled ? "opacity-50" : ""}`}
              >
                {/* Order */}
                <div className="w-12 flex items-center justify-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleMoveRule(index, -1)}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 dark:text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveRule(index, 1)}
                    disabled={index === config.listMapping.length - 1}
                    className="p-0.5 text-gray-400 dark:text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Active Switch */}
                <div className="w-14 flex justify-center flex-shrink-0">
                  <Switch
                    checked={rule.enabled}
                    onChange={(val) => handleUpdateRule(rule.id, "enabled", val)}
                    size="small"
                  />
                </div>

                {/* Pattern */}
                <div className="flex-1 min-w-[140px]">
                  <Input
                    value={rule.pattern}
                    onChange={(e) => handleUpdateRule(rule.id, "pattern", e.target.value)}
                    placeholder="e.g. ^sprint"
                    size="small"
                    className="cu-input"
                  />
                </div>

                {/* Match Type */}
                <div className="w-32 flex-shrink-0">
                  <Select
                    value={rule.matchType}
                    onChange={(val) => handleUpdateRule(rule.id, "matchType", val)}
                    size="small"
                    className="w-full cu-select"
                    options={[
                      { value: "contains", label: "Contains" },
                      { value: "regex", label: "Regex" },
                      { value: "exact", label: "Exact" },
                      { value: "startsWith", label: "Starts With" },
                    ]}
                  />
                </div>

                {/* Task Type */}
                <div className="w-40 flex-shrink-0">
                  <Select
                    showSearch
                    value={rule.type}
                    onChange={(val) => handleUpdateRule(rule.id, "type", val)}
                    size="small"
                    className="w-full cu-select"
                    options={[
                      ...selectOptions,
                      { value: "NF", label: "NF" },
                      { value: "Internal Bug", label: "Internal Bug" },
                      { value: "Panel Bugs", label: "Panel Bugs" },
                      { value: "Alpha Bugs", label: "Alpha Bugs" },
                    ]}
                  />
                </div>

                {/* Status Source */}
                <div className="w-36 flex-shrink-0">
                  <Select
                    value={rule.statusSource}
                    onChange={(val) => handleUpdateRule(rule.id, "statusSource", val)}
                    size="small"
                    className="w-full cu-select"
                    options={[
                      { value: "main_status", label: "Main Status" },
                      { value: "panel_field", label: "Panel Field" },
                    ]}
                  />
                </div>

                {/* Bug Type Source */}
                <div className="w-36 flex-shrink-0">
                  <Select
                    value={rule.bugTypeSource}
                    onChange={(val) => handleUpdateRule(rule.id, "bugTypeSource", val)}
                    size="small"
                    className="w-full cu-select"
                    options={[
                      { value: "custom_field", label: "Custom Field" },
                      { value: "none", label: "None" },
                    ]}
                  />
                </div>

                {/* Delete Button (SEPARATE from dropdown) */}
                <div className="w-10 flex justify-center flex-shrink-0">
                  <Popconfirm
                    title="Delete rule?"
                    onConfirm={() => handleDeleteRule(rule.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <button className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Button
            type="dashed"
            onClick={handleAddRule}
            icon={<Plus size={16} />}
            className="w-full !border-dashed !border-gray-300 dark:!border-neutral-700 dark:!text-neutral-400 dark:!bg-neutral-950 dark:hover:!text-emerald-400 dark:hover:!border-emerald-700"
          >
            Add New Rule
          </Button>
        </div>
      </div>

      {/* SECTION 5: HELP CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden p-2">
        <Collapse
          ghost
          expandIconPosition="end"
          items={helpItems}
          className="dark:text-white [&_.ant-collapse-header-text]:font-semibold"
        />
      </div>
      <Modal
        title="Link Test Results"
        open={testModalVisible}
        onOk={() => setTestModalVisible(false)}
        onCancel={() => setTestModalVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setTestModalVisible(false)}>
            OK
          </Button>
        ]}
        width={500}
      >
        <div className="mt-4">
          {testResult?.map((r, i) => (
            <div key={i} className="mb-4 bg-gray-50 dark:bg-[#242424] p-3 rounded-lg border border-gray-200 dark:border-[#333333]">
              <div className="font-bold text-gray-800 dark:text-gray-200 mb-1">
                {['Discussion', 'MR Issue', 'Testing'][i]}:
              </div>
              {r.name === "Not Found or Invalid" ? (
                <div className="text-red-500 font-medium">Not Found (Check Link / Token)</div>
              ) : (
                <div className="text-emerald-600 dark:text-emerald-400">
                  <div className="font-medium">Name: <span className="text-gray-600 dark:text-gray-300 font-normal">{r.name}</span></div>
                  <div className="font-medium">Status: <span className="text-gray-600 dark:text-gray-300 font-normal">{r.status}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  </>
  );
}
