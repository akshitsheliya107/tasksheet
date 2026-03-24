// import { useState, useCallback } from "react";
// import {
//   Plus,
//   Trash2,
//   Link,
//   ChevronDown,
//   ChevronRight,
//   Bug,
// } from "lucide-react";
// import { Modal, message, Collapse } from "antd";
// import debounce from "lodash.debounce";

// const { Panel } = Collapse;

// export default function TestingSection({
//   testing,
//   onUpdate,
//   onAddBug,
//   onUpdateBug,
//   onDeleteBug,
//   readOnly = false,
// }) {
//   const [isExpanded, setIsExpanded] = useState(true);
//   const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState([]);

//   const debouncedUpdate = useCallback(
//     debounce((updates) => {
//       if (!readOnly) onUpdate(updates);
//     }, 500),
//     [onUpdate, readOnly]
//   );

//   const handleTimeChange = (field, value) => {
//     const updated = {
//       ...testing,
//       testingTime: { ...testing.testingTime, [field]: Number(value) || 0 },
//     };
//     debouncedUpdate(updated);
//   };

//   const handleFieldChange = (field, value) => {
//     const updated = { ...testing, [field]: value };
//     debouncedUpdate(updated);
//   };

//   const debouncedBugUpdate = useCallback(
//     debounce((id, field, value) => {
//       if (!readOnly) onUpdateBug(id, field, value);
//     }, 500),
//     [onUpdateBug, readOnly]
//   );

//   const handleDeleteBug = (id) => {
//     Modal.confirm({
//       title: "Delete Bug",
//       content: "Are you sure you want to delete this bug entry?",
//       okText: "Delete",
//       cancelText: "Cancel",
//       okType: "danger",
//       centered: true,
//       onOk: async () => {
//         await onDeleteBug(id);
//         message.success("Bug deleted");
//       },
//     });
//   };

//   const totalMinutes =
//     (testing.testingTime?.hrs || 0) * 60 + (testing.testingTime?.min || 0);
//   const finalTime = (totalMinutes / 60).toFixed(2);

//   const handleAdditionalDetailsChange = (keys) => {
//     setAdditionalDetailsOpen(keys);
//   };

//   // Custom expand icon for the collapse
//   const customExpandIcon = ({ isActive }) => (
//     <div className="transition-transform duration-300 ease-in-out">
//       {isActive ? (
//         <ChevronDown size={16} className="text-purple-600" />
//       ) : (
//         <ChevronRight size={16} className="text-purple-600" />
//       )}
//     </div>
//   );

//   return (
//     <>
//       {/* Main Testing Section Header */}
//       <tr
//         className="bg-[#6e10b259] transition-all duration-200 cursor-pointer"
//         onClick={() => setIsExpanded(!isExpanded)}
//       >
//         <td colSpan={12} className="px-5 py-3.5">
//           <div className="flex items-center gap-3 text-white">
//             <div className="transition-transform duration-200">
//               {isExpanded ? (
//                 <ChevronDown size={18} />
//               ) : (
//                 <ChevronRight size={18} />
//               )}
//             </div>
//             <Bug size={18} />
//             <span className="font-semibold text-sm">Testing Section</span>
//             <div className="ml-auto flex items-center gap-3 text-sm">
//               <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm font-semibold">
//                 {finalTime} hrs
//               </span>
//               <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm font-semibold">
//                 {testing.bugs?.length || 0} bugs
//               </span>
//             </div>
//           </div>
//         </td>
//       </tr>

//       {isExpanded && (
//         <>
//           {/* Testing Time Row - Always Visible */}
//           <tr className="bg-purple-50/70 border-b border-purple-100 animate-slideDown">
//             <td
//               colSpan={2}
//               className="px-5 py-4 font-bold text-purple-800 border-r border-gray-200"
//             >
//               ⏱️ Testing Time
//             </td>
//             <td className="px-3 py-3 border-r border-gray-200">
//               <input
//                 type="number"
//                 min="0"
//                 defaultValue={testing.testingTime?.hrs || 0}
//                 onChange={(e) => handleTimeChange("hrs", e.target.value)}
//                 className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
//                 disabled={readOnly}
//                 placeholder="Hrs"
//               />
//             </td>
//             <td className="px-3 py-3 border-r border-gray-200">
//               <input
//                 type="number"
//                 min="0"
//                 max="59"
//                 defaultValue={testing.testingTime?.min || 0}
//                 onChange={(e) => handleTimeChange("min", e.target.value)}
//                 className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
//                 disabled={readOnly}
//                 placeholder="Min"
//               />
//             </td>
//             <td className="px-3 py-3 text-center font-bold text-purple-700 border-r border-gray-200">
//               {totalMinutes}
//             </td>
//             <td className="px-3 py-3 text-center font-bold text-purple-700 border-r border-gray-200">
//               {finalTime}
//             </td>
//             <td colSpan={6} className="bg-gray-50"></td>
//           </tr>

//           {/* Additional Details Collapse Row */}
//           <tr className="bg-white border-b border-gray-200">
//             <td colSpan={12} className="p-0">
//               <style>
//                 {`
//                   .testing-additional-details .ant-collapse {
//                     border: none;
//                     background: transparent;
//                     border-radius: 0;
//                   }
//                   .testing-additional-details .ant-collapse-item {
//                     border: none;
//                     border-radius: 0 !important;
//                   }
//                   .testing-additional-details .ant-collapse-header {
//                     background: linear-gradient(to right, #f3e8ff, #ede9fe);
//                     padding: 12px 20px !important;
//                     border-radius: 0 !important;
//                     font-weight: 600;
//                     color: #7c3aed;
//                     transition: all 0.3s ease;
//                   }
//                   .testing-additional-details .ant-collapse-header:hover {
//                     background: linear-gradient(to right, #ede9fe, #ddd6fe);
//                   }
//                   .testing-additional-details .ant-collapse-content {
//                     border: none;
//                     border-radius: 0;
//                   }
//                   .testing-additional-details .ant-collapse-content-box {
//                     padding: 0 !important;
//                   }
//                   .testing-additional-details .ant-collapse-expand-icon {
//                     padding-inline-end: 8px !important;
//                   }
//                 `}
//               </style>
//               <div className="testing-additional-details">
//                 <Collapse
//                   activeKey={additionalDetailsOpen}
//                   onChange={handleAdditionalDetailsChange}
//                   expandIcon={customExpandIcon}
//                   expandIconPosition="start"
//                   ghost={false}
//                 >
//                   <Panel
//                     header={
//                       <div className="flex items-center gap-2">
//                         <span>📋 Additional Details</span>
//                         <span className="text-xs text-purple-500 font-normal ml-2">
//                           (Testing Module, Scenarios & Bugs)
//                         </span>
//                       </div>
//                     }
//                     key="additional-details"
//                   >
//                     <table className="w-full border-collapse">
//                       <tbody>
//                         {/* Testing Module */}
//                         <tr className="bg-white border-b border-gray-200 animate-fadeIn">
//                           <td className="px-5 py-3 font-semibold text-gray-700 border-r border-gray-200 w-40">
//                             Testing Module
//                           </td>
//                           <td colSpan={11} className="px-3 py-3">
//                             <input
//                               type="text"
//                               defaultValue={testing.testingModule || ""}
//                               onChange={(e) =>
//                                 handleFieldChange(
//                                   "testingModule",
//                                   e.target.value
//                                 )
//                               }
//                               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
//                               placeholder="Enter module name..."
//                               disabled={readOnly}
//                             />
//                           </td>
//                         </tr>

//                         {/* Test Scenario */}
//                         <tr className="bg-white border-b border-gray-200 animate-fadeIn">
//                           <td className="px-5 py-3 font-semibold text-gray-700 border-r border-gray-200">
//                             Test Scenario
//                           </td>
//                           <td colSpan={11} className="px-3 py-3">
//                             <textarea
//                               defaultValue={testing.testCaseScenario || ""}
//                               onChange={(e) =>
//                                 handleFieldChange(
//                                   "testCaseScenario",
//                                   e.target.value
//                                 )
//                               }
//                               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-200"
//                               rows={2}
//                               placeholder="Describe test scenarios..."
//                               disabled={readOnly}
//                             />
//                           </td>
//                         </tr>

//                         {/* Bug Module */}
//                         <tr className="bg-white border-b border-gray-200 animate-fadeIn">
//                           <td className="px-5 py-3 font-semibold text-gray-700 border-r border-gray-200">
//                             Bug Module
//                           </td>
//                           <td colSpan={11} className="px-3 py-3">
//                             <input
//                               type="text"
//                               defaultValue={testing.bugFoundedModule || ""}
//                               onChange={(e) =>
//                                 handleFieldChange(
//                                   "bugFoundedModule",
//                                   e.target.value
//                                 )
//                               }
//                               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
//                               placeholder="Module where bugs found..."
//                               disabled={readOnly}
//                             />
//                           </td>
//                         </tr>

//                         {/* Bugs Header */}
//                         <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 animate-fadeIn">
//                           <td colSpan={10} className="px-5 py-4">
//                             <div className="flex items-center gap-2">
//                               <span className="font-bold text-gray-700">
//                                 🐛 Bugs Found:
//                               </span>
//                               <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold shadow-md">
//                                 {testing.bugs?.length || 0}
//                               </span>
//                             </div>
//                           </td>
//                           <td colSpan={2} className="px-3 py-3 text-right">
//                             {!readOnly && (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   onAddBug();
//                                 }}
//                                 className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
//                               >
//                                 <Plus size={16} /> Add Bug
//                               </button>
//                             )}
//                           </td>
//                         </tr>

//                         {/* Bug List */}
//                         {testing.bugs?.map((bug, index) => (
//                           <tr
//                             key={bug.id}
//                             className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 animate-fadeIn"
//                           >
//                             <td className="px-3 py-3 text-center border-r border-gray-200">
//                               <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 rounded-full text-xs font-bold shadow-sm">
//                                 {index + 1}
//                               </span>
//                             </td>
//                             <td
//                               colSpan={6}
//                               className="px-3 py-3 border-r border-gray-200"
//                             >
//                               <textarea
//                                 defaultValue={bug.description || ""}
//                                 onChange={(e) =>
//                                   debouncedBugUpdate(
//                                     bug.id,
//                                     "description",
//                                     e.target.value
//                                   )
//                                 }
//                                 className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-200"
//                                 rows={2}
//                                 placeholder="Bug description..."
//                                 disabled={readOnly}
//                               />
//                             </td>
//                             <td
//                               colSpan={4}
//                               className="px-3 py-3 border-r border-gray-200"
//                             >
//                               <div className="flex items-center gap-2">
//                                 <Link
//                                   size={16}
//                                   className="text-gray-400 flex-shrink-0"
//                                 />
//                                 <input
//                                   type="url"
//                                   defaultValue={bug.url || ""}
//                                   onChange={(e) =>
//                                     debouncedBugUpdate(
//                                       bug.id,
//                                       "url",
//                                       e.target.value
//                                     )
//                                   }
//                                   className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
//                                   placeholder="Bug URL..."
//                                   disabled={readOnly}
//                                 />
//                               </div>
//                             </td>
//                             {!readOnly && (
//                               <td className="px-3 py-3 text-center">
//                                 <button
//                                   onClick={() => handleDeleteBug(bug.id)}
//                                   className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
//                                 >
//                                   <Trash2 size={16} />
//                                 </button>
//                               </td>
//                             )}
//                           </tr>
//                         ))}

//                         {/* Empty State */}
//                         {(!testing.bugs || testing.bugs?.length === 0) && (
//                           <tr className="bg-gray-50 animate-fadeIn">
//                             <td
//                               colSpan={12}
//                               className="px-4 py-12 text-center text-gray-400"
//                             >
//                               <Bug
//                                 size={40}
//                                 className="mx-auto mb-3 opacity-30"
//                               />
//                               <p className="text-sm font-medium">
//                                 No bugs added yet
//                               </p>
//                               <p className="text-xs text-gray-400 mt-1">
//                                 Click "Add Bug" to report a new bug
//                               </p>
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </Panel>
//                 </Collapse>
//               </div>
//             </td>
//           </tr>
//         </>
//       )}
//     </>
//   );
// }

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
      className={`transition-transform duration-300 ease-in-out ${
        isActive ? "rotate-0" : "-rotate-90"
      }`}
    >
      <ChevronDown size={18} className="text-white" />
    </div>
  );

  // Custom expand icon for additional details
  const additionalExpandIcon = ({ isActive }) => (
    <div
      className={`transition-transform duration-300 ease-in-out ${
        isActive ? "rotate-0" : "-rotate-90"
      }`}
    >
      <ChevronDown size={16} className="text-purple-600" />
    </div>
  );

  return (
    <tr>
      <td colSpan={12} className="p-0">
        <style>
          {`
            /* Main Testing Section Collapse Styles */
            .testing-main-collapse .ant-collapse {
              border: none;
              background: transparent;
              border-radius: 0;
            }
            .testing-main-collapse .ant-collapse-item {
              border: none;
              border-radius: 0 !important;
            }
            .testing-main-collapse .ant-collapse-header {
              background: rgba(110, 16, 178, 0.35);
              padding: 14px 20px !important;
              border-radius: 0 !important;
              transition: all 0.3s ease;
            }
            .testing-main-collapse .ant-collapse-header:hover {
              background: rgba(110, 16, 178, 0.45);
            }
            .testing-main-collapse .ant-collapse-content {
              border: none;
              border-radius: 0;
              background: transparent;
            }
            .testing-main-collapse .ant-collapse-content-box {
              padding: 0 !important;
            }
            .testing-main-collapse .ant-collapse-expand-icon {
              padding-inline-end: 12px !important;
              color: white !important;
            }
            
            /* Additional Details Collapse Styles */
            .testing-additional-details .ant-collapse {
              border: none;
              background: transparent;
              border-radius: 0;
            }
            .testing-additional-details .ant-collapse-item {
              border: none;
              border-radius: 0 !important;
            }
            .testing-additional-details .ant-collapse-header {
              background: linear-gradient(to right, #f3e8ff, #ede9fe);
              padding: 12px 20px !important;
              border-radius: 0 !important;
              font-weight: 600;
              color: #7c3aed;
              transition: all 0.3s ease;
            }
            .testing-additional-details .ant-collapse-header:hover {
              background: linear-gradient(to right, #ede9fe, #ddd6fe);
            }
            .testing-additional-details .ant-collapse-content {
              border: none;
              border-radius: 0;
            }
            .testing-additional-details .ant-collapse-content-box {
              padding: 0 !important;
            }
            .testing-additional-details .ant-collapse-expand-icon {
              padding-inline-end: 8px !important;
            }

            /* Smooth animation for both collapses */
            .ant-collapse-content {
              transition: height 0.3s cubic-bezier(0.645, 0.045, 0.355, 1),
                          opacity 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
            }
            
            /* Animation for rows */
            @keyframes fadeSlideIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeSlideIn {
              animation: fadeSlideIn 0.3s ease-out forwards;
            }
          `}
        </style>

        <div className="testing-main-collapse">
          <Collapse
            activeKey={mainExpanded}
            onChange={handleMainExpandChange}
            expandIcon={mainExpandIcon}
            expandIconPosition="start"
          >
            <Panel
              header={
                <div className="flex items-center gap-3 text-white">
                  <Bug size={18} />
                  <span className="font-semibold text-sm">Testing Section</span>
                  <div className="ml-auto flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm font-semibold">
                      {finalTime} hrs
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm font-semibold">
                      {testing.bugs?.length || 0} bugs
                    </span>
                  </div>
                </div>
              }
              key="main-section"
            >
              <table className="w-full border-collapse">
                <tbody>
                  {/* Testing Time Row - Always Visible */}
                  <tr className="bg-purple-50/70 border-b border-purple-100 animate-fadeSlideIn">
                    <td
                      colSpan={2}
                      className="px-5 py-4 font-bold text-purple-800 border-r border-gray-200"
                      style={{ width: "150px" }}
                    >
                      ⏱️ Testing Time
                    </td>
                    <td
                      className="px-3 py-3 border-r border-gray-200"
                      style={{ width: "80px" }}
                    >
                      <input
                        type="number"
                        min="0"
                        defaultValue={testing.testingTime?.hrs || 0}
                        onChange={(e) =>
                          handleTimeChange("hrs", e.target.value)
                        }
                        className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                        disabled={readOnly}
                        placeholder="Hrs"
                      />
                    </td>
                    <td
                      className="px-3 py-3 border-r border-gray-200"
                      style={{ width: "80px" }}
                    >
                      <input
                        type="number"
                        min="0"
                        max="59"
                        defaultValue={testing.testingTime?.min || 0}
                        onChange={(e) =>
                          handleTimeChange("min", e.target.value)
                        }
                        className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                        disabled={readOnly}
                        placeholder="Min"
                      />
                    </td>
                    <td
                      className="px-3 py-3 text-center font-bold text-purple-700 border-r border-gray-200"
                      style={{ width: "80px" }}
                    >
                      {totalMinutes}
                    </td>
                    <td
                      className="px-3 py-3 text-center font-bold text-purple-700 border-r border-gray-200"
                      style={{ width: "80px" }}
                    >
                      {finalTime}
                    </td>
                    <td className="bg-gray-50"></td>
                  </tr>

                  {/* Additional Details Collapse Row */}
                  <tr className="bg-white border-b border-gray-200">
                    <td colSpan={12} className="p-0">
                      <div className="testing-additional-details">
                        <Collapse
                          activeKey={additionalDetailsOpen}
                          onChange={handleAdditionalDetailsChange}
                          expandIcon={additionalExpandIcon}
                          expandIconPosition="start"
                        >
                          <Panel
                            header={
                              <div className="flex items-center gap-2">
                                <span>📋 Additional Details</span>
                                <span className="text-xs text-purple-500 font-normal ml-2">
                                  (Testing Module, Scenarios & Bugs)
                                </span>
                              </div>
                            }
                            key="additional-details"
                          >
                            <table className="w-full border-collapse">
                              <tbody>
                                {/* Testing Module */}
                                <tr className="bg-white border-b border-gray-200 animate-fadeSlideIn">
                                  <td
                                    className="px-5 py-3 font-semibold text-gray-700 border-r border-gray-200"
                                    style={{ width: "150px" }}
                                  >
                                    Testing Module
                                  </td>
                                  <td colSpan={11} className="px-3 py-3">
                                    <input
                                      type="text"
                                      defaultValue={testing.testingModule || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "testingModule",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                                      placeholder="Enter module name..."
                                      disabled={readOnly}
                                    />
                                  </td>
                                </tr>

                                {/* Test Scenario */}
                                <tr className="bg-white border-b border-gray-200 animate-fadeSlideIn">
                                  <td className="px-5 py-3 font-semibold text-gray-700 border-r border-gray-200">
                                    Test Scenario
                                  </td>
                                  <td colSpan={11} className="px-3 py-3">
                                    <textarea
                                      defaultValue={
                                        testing.testCaseScenario || ""
                                      }
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "testCaseScenario",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-200"
                                      rows={2}
                                      placeholder="Describe test scenarios..."
                                      disabled={readOnly}
                                    />
                                  </td>
                                </tr>

                                {/* Bug Module */}
                                <tr className="bg-white border-b border-gray-200 animate-fadeSlideIn">
                                  <td className="px-5 py-3 font-semibold text-gray-700 border-r border-gray-200">
                                    Bug Module
                                  </td>
                                  <td colSpan={11} className="px-3 py-3">
                                    <input
                                      type="text"
                                      defaultValue={
                                        testing.bugFoundedModule || ""
                                      }
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "bugFoundedModule",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                                      placeholder="Module where bugs found..."
                                      disabled={readOnly}
                                    />
                                  </td>
                                </tr>

                                {/* Bugs Header */}
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 animate-fadeSlideIn">
                                  <td colSpan={10} className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-700">
                                        🐛 Bugs Found:
                                      </span>
                                      <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold shadow-md">
                                        {testing.bugs?.length || 0}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    colSpan={2}
                                    className="px-3 py-3 text-right"
                                  >
                                    {!readOnly && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onAddBug();
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                      >
                                        <Plus size={16} /> Add Bug
                                      </button>
                                    )}
                                  </td>
                                </tr>

                                {/* Bug List */}
                                {testing.bugs?.map((bug, index) => (
                                  <tr
                                    key={bug.id}
                                    className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-all duration-200 animate-fadeSlideIn"
                                    style={{
                                      animationDelay: `${index * 0.05}s`,
                                    }}
                                  >
                                    <td className="px-3 py-3 text-center border-r border-gray-200">
                                      <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 rounded-full text-xs font-bold shadow-sm">
                                        {index + 1}
                                      </span>
                                    </td>
                                    <td
                                      colSpan={6}
                                      className="px-3 py-3 border-r border-gray-200"
                                    >
                                      <textarea
                                        defaultValue={bug.description || ""}
                                        onChange={(e) =>
                                          debouncedBugUpdate(
                                            bug.id,
                                            "description",
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all duration-200"
                                        rows={2}
                                        placeholder="Bug description..."
                                        disabled={readOnly}
                                      />
                                    </td>
                                    <td
                                      colSpan={4}
                                      className="px-3 py-3 border-r border-gray-200"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Link
                                          size={16}
                                          className="text-gray-400 flex-shrink-0"
                                        />
                                        <input
                                          type="url"
                                          defaultValue={bug.url || ""}
                                          onChange={(e) =>
                                            debouncedBugUpdate(
                                              bug.id,
                                              "url",
                                              e.target.value
                                            )
                                          }
                                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                                          placeholder="Bug URL..."
                                          disabled={readOnly}
                                        />
                                      </div>
                                    </td>
                                    {!readOnly && (
                                      <td className="px-3 py-3 text-center">
                                        <button
                                          onClick={() =>
                                            handleDeleteBug(bug.id)
                                          }
                                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}

                                {/* Empty State */}
                                {(!testing.bugs ||
                                  testing.bugs?.length === 0) && (
                                  <tr className="bg-gray-50 animate-fadeSlideIn">
                                    <td
                                      colSpan={12}
                                      className="px-4 py-12 text-center text-gray-400"
                                    >
                                      <Bug
                                        size={40}
                                        className="mx-auto mb-3 opacity-30"
                                      />
                                      <p className="text-sm font-medium">
                                        No bugs added yet
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Click "Add Bug" to report a new bug
                                      </p>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </Panel>
                        </Collapse>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Panel>
          </Collapse>
        </div>
      </td>
    </tr>
  );
}
