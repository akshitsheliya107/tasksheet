import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  theme as antdThemeLib,
} from "antd";
import {
  Key,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Login from "./Login";

function AdminPanel({ currentUser, logout, isDarkMode, setIsDarkMode }) {
  const [users, setUsers] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoadingUid, setDeleteLoadingUid] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [passwordForm] = Form.useForm();
  const [createForm] = Form.useForm();

  async function handleLogout() {
    try {
      await logout();
    } catch (logoutError) {
      message.error(`Could not log out: ${logoutError.message}`);
    }
  }

  const adminRequest = useCallback(
    async (payload) => {
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/.netlify/functions/admin-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Admin API returned an invalid response (${response.status}).`);
      }
      if (!response.ok) {
        throw new Error(result.error || "Admin request failed");
      }
      return result;
    },
    [currentUser]
  );

  const loadUsers = useCallback(
    async (pageToken = null, append = false) => {
      setLoading(true);
      setError("");
      try {
        const result = await adminRequest({ action: "listUsers", pageToken });
        setUsers((previous) => (append ? [...previous, ...result.users] : result.users));
        setNextPageToken(result.nextPageToken || null);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    },
    [adminRequest]
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreateUser(values) {
    try {
      setCreateLoading(true);
      const result = await adminRequest({
        action: "createUser",
        email: values.email,
        displayName: values.displayName,
        password: values.password,
      });
      message.success(`User ${result.user.email} created successfully!`);
      setCreateModalOpen(false);
      createForm.resetFields();
      loadUsers();
    } catch (createError) {
      message.error(createError.message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteUser(user) {
    try {
      setDeleteLoadingUid(user.uid);
      await adminRequest({
        action: "deleteUser",
        uid: user.uid,
      });
      message.success(`Account for ${user.email || user.uid} deleted permanently.`);
      setUsers((previous) => previous.filter((u) => u.uid !== user.uid));
    } catch (deleteError) {
      message.error(deleteError.message);
    } finally {
      setDeleteLoadingUid(null);
    }
  }

  async function handlePasswordReset({ password }) {
    if (!selectedUser) return;
    try {
      setResetLoading(true);
      await adminRequest({
        action: "setTemporaryPassword",
        uid: selectedUser.uid,
        password,
      });
      message.success(`Temporary password updated for ${selectedUser.email || selectedUser.uid}.`);
      setSelectedUser(null);
      passwordForm.resetFields();
    } catch (requestError) {
      message.error(requestError.message);
    } finally {
      setResetLoading(false);
    }
  }

  // Filtered users based on Search bar (email or name)
  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.displayName || "").toLowerCase();
      const uid = (u.uid || "").toLowerCase();
      return email.includes(q) || name.includes(q) || uid.includes(q);
    });
  }, [users, searchText]);

  const columns = [
    {
      title: "Name / Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      render: (email, record) => (
        <div>
          {record.displayName && (
            <div className="font-semibold text-gray-900 dark:text-gray-100">{record.displayName}</div>
          )}
          <span className="font-medium text-gray-800 dark:text-gray-200">{email || "No email"}</span>
          {record.uid === currentUser.uid && (
            <Tag color="green" className="ml-2">
              You (Admin)
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "User ID",
      dataIndex: "uid",
      key: "uid",
      render: (uid) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{uid}</span>,
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      },
      render: (value) =>
        value ? (
          <div>
            <div className="text-sm text-gray-800 dark:text-gray-200">{new Date(value).toLocaleDateString()}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        ) : (
          "—"
        ),
    },
    {
      title: "Last Sign In",
      dataIndex: "lastSignInTime",
      key: "lastSignInTime",
      defaultSortOrder: "descend",
      sorter: (a, b) => {
        const timeA = a.lastSignInTime ? new Date(a.lastSignInTime).getTime() : 0;
        const timeB = b.lastSignInTime ? new Date(b.lastSignInTime).getTime() : 0;
        return timeA - timeB;
      },
      filters: [
        { text: "Logged in at least once", value: "active" },
        { text: "Never logged in", value: "never" },
      ],
      onFilter: (value, record) => {
        if (value === "active") return Boolean(record.lastSignInTime);
        if (value === "never") return !record.lastSignInTime;
        return true;
      },
      render: (value) =>
        value ? (
          <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{new Date(value).toLocaleDateString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        ) : (
          <Tag color="default">Never</Tag>
        ),
    },
    {
      title: "Actions",
      key: "action",
      width: 220,
      render: (_, user) => {
        const isSelf = user.uid === currentUser.uid;
        return (
          <Space orientation="horizontal" size="small">
            <Button
              size="small"
              icon={<Key size={14} />}
              disabled={isSelf}
              onClick={() => setSelectedUser(user)}
            >
              Reset
            </Button>
            <Popconfirm
              title="Delete user permanently?"
              description={`Are you sure you want to permanently delete "${user.email || user.uid}"? This cannot be undone.`}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleteLoadingUid === user.uid }}
              disabled={isSelf}
              onConfirm={() => handleDeleteUser(user)}
            >
              <Button
                size="small"
                danger
                icon={<Trash2 size={14} />}
                disabled={isSelf}
                loading={deleteLoadingUid === user.uid}
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] p-4 md:p-8 transition-colors duration-300">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-[#333333] pb-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={22} />
              <span className="font-semibold">Admin Console</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Accounts</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Signed in as a <span className="font-medium text-gray-900 dark:text-gray-200">Admin</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${isDarkMode
                  ? "bg-[#242424] border-[#333333] text-amber-400 hover:bg-[#2d2d2d]"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Button icon={<LogOut size={16} />} onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>

        {error && (
          <Alert
            className="mb-4"
            type="error"
            showIcon
            message="Admin access or request failed"
            description={error}
          />
        )}

        {/* Controls: Search Bar + Add User + Refresh */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              prefix={<Search size={16} className="text-gray-400" />}
              placeholder="Search by name, email, or UID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<UserPlus size={16} />}
              onClick={() => {
                createForm.resetFields();
                setCreateModalOpen(true);
              }}
            >
              Add New User
            </Button>

            <Button
              icon={<RefreshCw size={16} />}
              onClick={() => loadUsers()}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Table
          rowKey="uid"
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
          locale={{
            emptyText: loading
              ? "Loading users..."
              : searchText
                ? `No users matching "${searchText}"`
                : "No users found",
          }}
        />

        {nextPageToken && (
          <div className="mt-4 text-center">
            <Button onClick={() => loadUsers(nextPageToken, true)} loading={loading}>
              Load more users
            </Button>
          </div>
        )}
      </div>

      {/* Add New User Modal */}
      <Modal
        title="Add New User"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Create a new user account directly in Firebase Authentication.
        </p>
        <Form form={createForm} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item label="Full Name (Optional)" name="displayName">
            <Input placeholder="e.g. John Doe" />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter an email address" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input placeholder="user@company.com" />
          </Form.Item>

          <Form.Item
            label="Initial Password"
            name="password"
            rules={[
              { required: true, message: "Please enter an initial password" },
              { min: 6, message: "Password must be at least 6 characters" },
              { max: 128, message: "Password must be 128 characters or fewer" },
            ]}
          >
            <Input.Password placeholder="Min 6 characters" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Repeat password" autoComplete="new-password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={createLoading} block>
            Create Account
          </Button>
        </Form>
      </Modal>

      {/* Set Temporary Password Modal */}
      <Modal
        title={`Set temporary password${selectedUser?.email ? ` for ${selectedUser.email}` : ""}`}
        open={Boolean(selectedUser)}
        onCancel={() => {
          setSelectedUser(null);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Share the password with the user privately. It remains active until changed again.
        </p>
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordReset}>
          <Form.Item
            label="Temporary password"
            name="password"
            rules={[
              { required: true, message: "Enter a temporary password" },
              { min: 12, message: "Use at least 12 characters" },
              { max: 128, message: "Password must be 128 characters or fewer" },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Confirm temporary password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirm the temporary password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={resetLoading} block>
            Set password
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

export default function AdminConsole() {
  const { currentUser, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dark-mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("dark-mode", isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const antdTheme = useMemo(
    () => ({
      algorithm: isDarkMode ? antdThemeLib.darkAlgorithm : antdThemeLib.defaultAlgorithm,
      token: {
        colorPrimary: "#10b981",
        borderRadius: 8,
        fontSize: 14,
        colorBgBase: isDarkMode ? "#242424" : "#ffffff",
        colorTextBase: isDarkMode ? "#f3f4f6" : "#1f2937",
      },
    }),
    [isDarkMode]
  );

  return (
    <ConfigProvider theme={antdTheme}>
      {!currentUser ? (
        <Login adminLogin />
      ) : (
        <AdminPanel
          currentUser={currentUser}
          logout={logout}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      )}
    </ConfigProvider>
  );
}
