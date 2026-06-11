import { useState } from "react";
import { 
  Search, RefreshCw, CheckCircle, AlertTriangle, 
  Layers, Database, Tag, ChevronRight, ChevronDown,
  Sparkles, Copy, Eye, EyeOff
} from "lucide-react";
import { Button, Alert, Tag as AntTag, Collapse, message, Tooltip } from "antd";
import toast from "react-hot-toast";
import { clickupSyncAPI, clickupConfigAPI } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";

const discoveryStyles = `
  .dark .discovery-card {
    background-color: #0a0a0a !important;
    border-color: #262626 !important;
  }
  .dark .discovery-section {
    background-color: #171717 !important;
    border-color: #262626 !important;
  }
`;

export default function ClickupDiscovery() {
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedLists, setExpandedLists] = useState({});
  const [applying, setApplying] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setData(null);

    try {
      toast("🔍 Scanning your ClickUp workspace... This may take 20-30 seconds", { 
        duration: 5000,
        icon: "⏳"
      });
      
      const result = await clickupSyncAPI.discoverWorkspace();
      
      if (result.success) {
        setData(result);
        toast.success(`Found ${result.summary.totalLists} lists with ${result.summary.totalCustomFields} unique fields`);
      } else {
        setError(result.error);
        toast.error(result.error || "Scan failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to scan workspace");
    } finally {
      setScanning(false);
    }
  };

  const handleApplyRule = async (rule) => {
    try {
      const config = await clickupConfigAPI.get();
      const existing = config.listMapping || [];
      
      // Check if rule with same pattern already exists
      const duplicate = existing.find(r => r.pattern === rule.pattern);
      if (duplicate) {
        toast(`Rule for "${rule.pattern}" already exists`, { icon: "ℹ️" });
        return;
      }
      
      // Add new rule
      const newRule = {
        id: `rule_${Date.now()}`,
        pattern: rule.pattern,
        matchType: rule.matchType,
        type: rule.type,
        statusSource: rule.statusSource,
        bugTypeSource: rule.bugTypeSource,
        enabled: true,
      };
      
      const updated = {
        ...config,
        listMapping: [...existing, newRule],
      };
      
      await clickupConfigAPI.update(updated);
      toast.success(`✅ Rule added: ${rule.type}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply rule");
    }
  };

  const handleApplyAll = async () => {
    if (!data?.suggestedRules?.length) return;
    
    setApplying(true);
    try {
      const config = await clickupConfigAPI.get();
      const existing = config.listMapping || [];
      const existingPatterns = new Set(existing.map(r => r.pattern));
      
      const newRules = data.suggestedRules
        .filter(r => !existingPatterns.has(r.pattern))
        .map((r, i) => ({
          id: `rule_${Date.now()}_${i}`,
          pattern: r.pattern,
          matchType: r.matchType,
          type: r.type,
          statusSource: r.statusSource,
          bugTypeSource: r.bugTypeSource,
          enabled: true,
        }));
      
      if (newRules.length === 0) {
        toast("All suggested rules already exist", { icon: "ℹ️" });
        setApplying(false);
        return;
      }
      
      const updated = {
        ...config,
        listMapping: [...existing, ...newRules],
      };
      
      await clickupConfigAPI.update(updated);
      toast.success(`✅ Added ${newRules.length} new mapping rules`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply rules");
    } finally {
      setApplying(false);
    }
  };

  const toggleList = (listId) => {
    setExpandedLists(prev => ({ ...prev, [listId]: !prev[listId] }));
  };

  return (
    <>
      <style>{discoveryStyles}</style>
      <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-12">
        {/* HEADER */}
        <div className="discovery-card bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                <Search className="text-emerald-600" />
                ClickUp Discovery
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scan your ClickUp workspace to discover lists, custom fields, and get smart mapping suggestions
              </p>
            </div>
            <Button
              type="primary"
              size="large"
              loading={scanning}
              onClick={handleScan}
              icon={<RefreshCw size={16} />}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {scanning ? "Scanning..." : data ? "Re-Scan" : "Scan Workspace"}
            </Button>
          </div>

          {!data && !scanning && !error && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>What does this do?</strong>
              </p>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc pl-5 space-y-1">
                <li>Scans all your accessible ClickUp lists</li>
                <li>Discovers all custom fields and their types</li>
                <li>Shows sample tasks to understand structure</li>
                <li>Suggests smart mapping rules you can apply with one click</li>
                <li>Safe: doesn't modify any data, only reads</li>
              </ul>
            </div>
          )}

          {error && (
            <Alert
              type="error"
              showIcon
              message="Scan Failed"
              description={error}
              className="mt-4"
            />
          )}
        </div>

        {scanning && <LoadingSpinner message="Scanning ClickUp workspace... please wait" />}

        {data && (
          <>
            {/* SUMMARY STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox icon={Layers} label="Lists" value={data.summary.totalLists} color="blue" />
              <StatBox icon={Database} label="Custom Fields" value={data.summary.totalCustomFields} color="purple" />
              <StatBox icon={Tag} label="Task Types" value={data.summary.totalTaskTypes} color="emerald" />
              <StatBox icon={Sparkles} label="Suggested Rules" value={data.suggestedRules?.length || 0} color="amber" />
            </div>

            {/* SUGGESTED RULES */}
            {data.suggestedRules?.length > 0 && (
              <div className="discovery-card bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    Suggested Mapping Rules
                  </h3>
                  <Button
                    type="primary"
                    onClick={handleApplyAll}
                    loading={applying}
                    icon={<CheckCircle size={14} />}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Apply All
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {data.suggestedRules.map((rule, i) => (
                    <div 
                      key={i}
                      className="discovery-section bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <AntTag color="purple">Pattern: {rule.pattern}</AntTag>
                            <AntTag color="blue">Match: {rule.matchType}</AntTag>
                            <AntTag color="emerald">Type: {rule.type}</AntTag>
                            <AntTag color="cyan">Status: {rule.statusSource}</AntTag>
                            <AntTag color="orange">Bug Type: {rule.bugTypeSource}</AntTag>
                          </div>
                          {rule.reason && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              💡 {rule.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => handleApplyRule(rule)}
                          className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOM FIELDS */}
            <div className="discovery-card bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Database size={18} className="text-purple-500" />
                Custom Fields Inventory ({data.customFields.length})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-950 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Field Name</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Sample Values</th>
                      <th className="px-3 py-2 text-left">Used In Lists</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                    {data.customFields.map((cf, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-950">
                        <td className="px-3 py-2 font-mono text-gray-800 dark:text-gray-200">
                          {cf.name}
                          <Tooltip title="Copy name">
                            <Copy 
                              size={12} 
                              className="inline ml-2 text-gray-400 hover:text-emerald-600 cursor-pointer"
                              onClick={() => {
                                navigator.clipboard.writeText(cf.name);
                                toast.success("Copied!");
                              }}
                            />
                          </Tooltip>
                        </td>
                        <td className="px-3 py-2">
                          <AntTag color={cf.type === 'drop_down' ? 'blue' : cf.type === 'labels' ? 'purple' : 'default'}>
                            {cf.type}
                          </AntTag>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {cf.sampleValues?.slice(0, 3).map((v, j) => (
                              <AntTag key={j} className="text-xs">{String(v).slice(0, 30)}</AntTag>
                            )) || <span className="text-gray-400 italic">no samples</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                          {cf.usedInLists?.slice(0, 3).join(", ")}
                          {cf.usedInLists?.length > 3 && ` +${cf.usedInLists.length - 3} more`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LISTS */}
            <div className="discovery-card bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Layers size={18} className="text-blue-500" />
                Lists Discovered ({data.lists.length})
              </h3>
              
              <div className="space-y-2">
                {data.lists.map((list) => (
                  <div 
                    key={list.listId}
                    className="discovery-section bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleList(list.listId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left">
                        {expandedLists[list.listId] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-white">{list.listName}</span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {list.space} {list.folder && `→ ${list.folder}`}
                          </span>
                        </div>
                      </div>
                      <AntTag color="blue">{list.taskCount} tasks</AntTag>
                    </button>
                    
                    {expandedLists[list.listId] && list.sampleTasks?.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Sample Tasks:</p>
                        {list.sampleTasks.map((t, i) => (
                          <div key={i} className="mb-3 last:mb-0 p-3 bg-gray-50 dark:bg-neutral-950 rounded border border-gray-200 dark:border-neutral-800">
                            <p className="text-sm font-medium text-gray-800 dark:text-white mb-1">{t.name}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Status: <AntTag>{t.mainStatus}</AntTag></span>
                            </div>
                            {t.customFields?.length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-emerald-600 cursor-pointer">
                                  {t.customFields.length} custom fields
                                </summary>
                                <div className="mt-2 space-y-1">
                                  {t.customFields.map((cf, j) => (
                                    <div key={j} className="text-xs flex gap-2">
                                      <span className="font-mono text-gray-600 dark:text-gray-400">{cf.name}:</span>
                                      <span className="text-gray-800 dark:text-gray-200">
                                        {cf.value !== null && cf.value !== undefined ? JSON.stringify(cf.value) : <span className="text-gray-400 italic">empty</span>}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
