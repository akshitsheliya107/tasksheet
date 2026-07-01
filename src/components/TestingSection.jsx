

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Link,
  ChevronDown,
  ChevronRight,
  Bug,
} from "lucide-react";
import { Modal, message, Collapse } from "antd";
import debounce from "lodash.debounce";

const { Panel } = Collapse;

export default function TestingSection({
  testing,
  onUpdate,
  onAddBug,
  onUpdateBug,
  onDeleteBug,
  readOnly = false,
}) {
  const [mainExpanded, setMainExpanded] = useState(["main-section"]);
  const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState([]);

  const debouncedUpdate = useCallback(
    debounce((updates) => {
      if (!readOnly) onUpdate(updates);
    }, 500),
    [onUpdate, readOnly]
  );

  const handleTimeChange = (field, value) => {
    const updated = {
      ...testing,
      testingTime: { ...testing.testingTime, [field]: Number(value) || 0 },
    };
    debouncedUpdate(updated);
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...testing, [field]: value };
    debouncedUpdate(updated);
  };

  const debouncedBugUpdate = useCallback(
    debounce((id, field, value) => {
      if (!readOnly) onUpdateBug(id, field, value);
    }, 500),
    [onUpdateBug, readOnly]
  );

  const handleDeleteBug = (id) => {
    Modal.confirm({
      title: "Delete Bug",
      content: "Are you sure you want to delete this bug entry?",
      okText: "Delete",
      cancelText: "Cancel",
      okType: "danger",
      centered: true,
      onOk: async () => {
        await onDeleteBug(id);
        message.success("Bug deleted");
      },
    });
  };

  const totalMinutes =
    (testing.testingTime?.hrs || 0) * 60 + (testing.testingTime?.min || 0);
  const finalTime = (totalMinutes / 60).toFixed(2);

  const handleMainExpandChange = (keys) => {
    setMainExpanded(keys);
  };

  const handleAdditionalDetailsChange = (keys) => {
    setAdditionalDetailsOpen(keys);
  };

  // Custom expand icon for main section
  const mainExpandIcon = ({ isActive }) => (
    <div
      className={`transition-transform duration-300 ease-in-out ${isActive ? "rotate-0" : "-rotate-90"
        }`}
    >
      <ChevronDown size={18} className="text-white" />
    </div>
  );

  // Custom expand icon for additional details
  const additionalExpandIcon = ({ isActive }) => (
    <div
      className={`transition-transform duration-300 ease-in-out ${isActive ? "rotate-0" : "-rotate-90"
        }`}
    >
      <ChevronDown size={16} className="text-purple-600" />
    </div>
  );

  return (
    <tr>
      <td colSpan={13} className="p-0 border-b border-[#333333]">
     

        <div className="testing-main-collapse my-2 mx-4 rounded-xl overflow-hidden border border-[#333333] bg-[#242424]">
          <Collapse
            activeKey={mainExpanded}
            onChange={handleMainExpandChange}
            expandIcon={mainExpandIcon}
            expandIconPlacement="start"
            items={[
              {
                key: "main-section",
                label: (
                  <div className="flex items-center gap-3 text-white">
                    <Bug size={18} />
                    <span className="font-semibold text-sm text">Testing Section</span>
                    <div className="ml-auto flex items-center gap-3 text-sm">
                      <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm font-semibold">
                        {finalTime} hrs
                      </span>
                      <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm font-semibold">
                        {testing.bugs?.length || 0} bugs
                      </span>
                    </div>
                  </div>
                ),
                children: (
                  <table className="w-full border-collapse">
                    <tbody>
                      {/* Testing Time Row - Always Visible */}
                      <tr className="bg-[#1A1A1A]">
                        <td
                          className="px-4 py-3 font-bold text-[#c084fc] border-r border-[#333333] text-sm"
                          style={{ width: "560px", minWidth: "560px" }}
                        >
                          <div className="flex items-center gap-2">
                            ⏱️ Testing Time
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 border-r border-[#333333]"
                          style={{ width: "100px", minWidth: "100px" }}
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            defaultValue={testing.testingTime?.hrs || 0}
                            onKeyDown={(e) => {
                              const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                              if (allowedKeys.includes(e.key)) return;
                              if (e.ctrlKey || e.metaKey) return;
                              if (!/^\d$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              e.target.value = val;
                              handleTimeChange("hrs", val ? Number(val) : 0);
                            }}
                            className="w-full px-2 py-2 text-sm text-center bg-[#2A2A2A] border border-[#404040] text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                            disabled={readOnly}
                            placeholder="Hrs"
                          />
                        </td>
                        <td
                          className="px-4 py-3 border-r border-[#333333]"
                          style={{ width: "100px", minWidth: "100px" }}
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            defaultValue={testing.testingTime?.min || 0}
                            onKeyDown={(e) => {
                              const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
                              if (allowedKeys.includes(e.key)) return;
                              if (e.ctrlKey || e.metaKey) return;
                              if (!/^\d$/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (Number(val) > 59) val = "59";
                              e.target.value = val;
                              handleTimeChange("min", val ? Number(val) : 0);
                            }}
                            className="w-full px-2 py-2 text-sm text-center bg-[#2A2A2A] border border-[#404040] text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                            disabled={readOnly}
                            placeholder="Min"
                          />
                        </td>
                        <td
                          className="px-4 py-3 text-center text-sm font-semibold text-[#c084fc] border-r border-[#333333]"
                          style={{ width: "80px", minWidth: "80px" }}
                        >
                          {totalMinutes}
                        </td>
                        <td
                          className="px-4 py-3 text-center text-sm font-bold text-[#c084fc] border-r border-[#333333]"
                          style={{ width: "80px", minWidth: "80px" }}
                        >
                          {finalTime}
                        </td>
                        <td className="bg-[#1A1A1A]"></td>
                      </tr>

                      {/* Additional Details Collapse Row */}
                      <tr className="bg-white border-b border-gray-200">
                        <td colSpan={12} className="p-0">
                          <div className="testing-additional-details">
                            <Collapse
                              activeKey={additionalDetailsOpen}
                              onChange={handleAdditionalDetailsChange}
                              expandIcon={additionalExpandIcon}
                              expandIconPlacement="start"
                              // items={[
                              //   {
                              //     key: "additional-details",
                              //     label: (
                              //       <div className="flex items-center gap-2">
                              //         <span>📋 Additional Details</span>
                              //         <span className="text-xs text-purple-500 font-normal ml-2">
                              //           (Testing Module, Scenarios & Bugs)
                              //         </span>
                              //       </div>
                              //     ),
                              //     children: (
                              //       <table className="w-full border-collapse">
                              //         <tbody>
                              //           {/* Testing Module */}
                              //           <tr className="bg-[#FFFFFF] dark:bg-[#242424] border-b border-gray-200 dark:border-[#333333] animate-fadeSlideIn">
                              //             <td
                              //               className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-[#333333]"
                              //               style={{ width: "150px" }}
                              //             >
                              //               Testing Module
                              //             </td>
                              //             <td colSpan={11} className="px-3 py-3">
                              //               <input
                              //                 type="text"
                              //                 defaultValue={testing.testingModule || ""}
                              //                 onChange={(e) =>
                              //                   handleFieldChange(
                              //                     "testingModule",
                              //                     e.target.value
                              //                   )
                              //                 }
                              //                 className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[#FFFFFF] dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 transition-all duration-200"
                              //                 placeholder="Enter module name..."
                              //                 disabled={readOnly}
                              //               />
                              //             </td>
                              //           </tr>

                              //           {/* Test Scenario */}
                              //           <tr className="bg-[#FFFFFF] dark:bg-[#242424] border-b border-gray-200 dark:border-[#333333] animate-fadeSlideIn">
                              //             <td className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-[#333333]">
                              //               Test Scenario
                              //             </td>
                              //             <td colSpan={11} className="px-3 py-3">
                              //               <textarea
                              //                 defaultValue={
                              //                   testing.testCaseScenario || ""
                              //                 }
                              //                 onChange={(e) =>
                              //                   handleFieldChange(
                              //                     "testCaseScenario",
                              //                     e.target.value
                              //                   )
                              //                 }
                              //                 className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[#FFFFFF] dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 resize-none transition-all duration-200"
                              //                 rows={2}
                              //                 placeholder="Describe test scenarios..."
                              //                 disabled={readOnly}
                              //               />
                              //             </td>
                              //           </tr>

                              //           {/* Bug Module */}
                              //           <tr className="bg-[#FFFFFF] dark:bg-[#242424] border-b border-gray-200 dark:border-[#333333] animate-fadeSlideIn">
                              //             <td className="px-5 py-3 font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-[#333333]">
                              //               Bug Module
                              //             </td>
                              //             <td colSpan={11} className="px-3 py-3">
                              //               <input
                              //                 type="text"
                              //                 defaultValue={
                              //                   testing.bugFoundedModule || ""
                              //                 }
                              //                 onChange={(e) =>
                              //                   handleFieldChange(
                              //                     "bugFoundedModule",
                              //                     e.target.value
                              //                   )
                              //                 }
                              //                 className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[#FFFFFF] dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 transition-all duration-200"
                              //                 placeholder="Module where bugs found..."
                              //                 disabled={readOnly}
                              //               />
                              //             </td>
                              //           </tr>

                              //           {/* Bugs Header */}
                              //           <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-[#333333] animate-fadeSlideIn">
                              //             <td colSpan={10} className="px-5 py-4">
                              //               <div className="flex items-center gap-2">
                              //                 <span className="font-bold text-gray-700 dark:text-gray-200">
                              //                   🐛 Bugs Found:
                              //                 </span>
                              //                 <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold shadow-md">
                              //                   {testing.bugs?.length || 0}
                              //                 </span>
                              //               </div>
                              //             </td>
                              //             <td
                              //               colSpan={2}
                              //               className="px-3 py-3 text-right"
                              //             >
                              //               {!readOnly && (
                              //                 <button
                              //                   onClick={(e) => {
                              //                     e.stopPropagation();
                              //                     onAddBug();
                              //                   }}
                              //                   className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                              //                 >
                              //                   <Plus size={16} /> Add Bug
                              //                 </button>
                              //               )}
                              //             </td>
                              //           </tr>

                              //           {/* Bug List */}
                              //           {testing.bugs?.map((bug, index) => (
                              //             <tr
                              //               key={bug.id}
                              //               className="bg-[#FFFFFF] dark:bg-[#242424] border-b border-gray-200 dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 animate-fadeSlideIn"
                              //               style={{
                              //                 animationDelay: `${index * 0.05}s`,
                              //               }}
                              //             >
                              //               <td className="px-3 py-3 text-center border-r border-gray-200 dark:border-[#333333]">
                              //                 <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold shadow-sm border border-purple-200 dark:border-purple-700/50">
                              //                   {index + 1}
                              //                 </span>
                              //               </td>
                              //               <td
                              //                 colSpan={6}
                              //                 className="px-3 py-3 border-r border-gray-200 dark:border-[#333333]"
                              //               >
                              //                 <textarea
                              //                   defaultValue={bug.description || ""}
                              //                   onChange={(e) =>
                              //                     debouncedBugUpdate(
                              //                       bug.id,
                              //                       "description",
                              //                       e.target.value
                              //                     )
                              //                   }
                              //                   className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[#FFFFFF] dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 resize-none transition-all duration-200"
                              //                   rows={2}
                              //                   placeholder="Bug description..."
                              //                   disabled={readOnly}
                              //                 />
                              //               </td>
                              //               <td
                              //                 colSpan={4}
                              //                 className="px-3 py-3 border-r border-gray-200 dark:border-[#333333]"
                              //               >
                              //                 <div className="flex items-center gap-2">
                              //                   <Link
                              //                     size={16}
                              //                     className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                              //                   />
                              //                   <input
                              //                     type="url"
                              //                     defaultValue={bug.url || ""}
                              //                     onChange={(e) =>
                              //                       debouncedBugUpdate(
                              //                         bug.id,
                              //                         "url",
                              //                         e.target.value
                              //                       )
                              //                     }
                              //                     className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-[#404040] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[#FFFFFF] dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 transition-all duration-200"
                              //                     placeholder="Bug URL..."
                              //                     disabled={readOnly}
                              //                   />
                              //                 </div>
                              //               </td>
                              //               {!readOnly && (
                              //                 <td className="px-3 py-3 text-center">
                              //                   <button
                              //                     onClick={() =>
                              //                       handleDeleteBug(bug.id)
                              //                     }
                              //                     className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-110"
                              //                   >
                              //                     <Trash2 size={16} />
                              //                   </button>
                              //                 </td>
                              //               )}
                              //             </tr>
                              //           ))}

                              //           {/* Empty State */}
                              //           {(!testing.bugs ||
                              //             testing.bugs?.length === 0) && (
                              //               <tr className="bg-[#FDFDFD] dark:bg-[#242424]/50 animate-fadeSlideIn">
                              //                 <td
                              //                   colSpan={12}
                              //                   className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                              //                 >
                              //                   <Bug
                              //                     size={40}
                              //                     className="mx-auto mb-3 opacity-30"
                              //                   />
                              //                   <p className="text-sm font-medium">
                              //                     No bugs added yet
                              //                   </p>
                              //                   <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              //                     Click "Add Bug" to report a new bug
                              //                   </p>
                              //                 </td>
                              //               </tr>
                              //             )}
                              //         </tbody>
                              //       </table>
                              //     )
                              //   }
                              // ]}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              }]}
          />
        </div>
      </td>
    </tr>
  );
}
