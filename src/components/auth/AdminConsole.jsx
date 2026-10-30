import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Form, Input, message, Modal, Table } from "antd";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Login from "./Login";

function AdminPanel({ currentUser, logout }) {
  const [users, setUsers] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [form] = Form.useForm();

  async function handleLogout() {
    try {
      await logout();
    } catch (logoutError) {
      message.error(`Could not log out: ${logoutError.message}`);
    }
  }

  const adminRequest = useCallback(async (payload) => {
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
  }, [currentUser]);

  const loadUsers = useCallback(async (pageToken = null, append = false) => {
    setLoading(true);
    setError("");
    try {
      const result = await adminRequest({ action: "listUsers", pageToken });
      setUsers((previous) => append ? [...previous, ...result.users] : result.users);
      setNextPageToken(result.nextPageToken || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [adminRequest]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
      form.resetFields();
    } catch (requestError) {
      message.error(requestError.message);
    } finally {
      setResetLoading(false);
    }
  }

  const columns = [
    {
      title: "Email / Login ID",
      dataIndex: "email",
      key: "email",
      render: (email) => email || "No email",
    },
    {
      title: "User ID",
      dataIndex: "uid",
      key: "uid",
      render: (uid) => <span className="font-mono text-xs">{uid}</span>,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => value ? new Date(value).toLocaleDateString() : "—",
    },
    {
      title: "Last sign in",
      dataIndex: "lastSignInTime",
      key: "lastSignInTime",
      render: (value) => value ? new Date(value).toLocaleString() : "Never",
    },
    {
      title: "Action",
      key: "action",
      render: (_, user) => (
        <Button
          type="primary"
          disabled={user.uid === currentUser.uid}
          onClick={() => setSelectedUser(user)}
        >
          Set temporary password
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-emerald-700">
              <ShieldCheck size={22} />
              <span className="font-semibold">Admin Console</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">User accounts</h1>
            <p className="mt-1 text-sm text-gray-600">
              Signed in as {currentUser.email || currentUser.uid}
            </p>
          </div>
          <Button icon={<LogOut size={16} />} onClick={handleLogout}>
            Log out
          </Button>
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

        <div className="mb-4 flex justify-end gap-2">
          <Button
            icon={<RefreshCw size={16} />}
            onClick={() => loadUsers()}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <Table
          rowKey="uid"
          columns={columns}
          dataSource={users}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
          locale={{ emptyText: loading ? "Loading users..." : "No users found" }}
        />
        {nextPageToken && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => loadUsers(nextPageToken, true)}
              loading={loading}
            >
              Load more users
            </Button>
          </div>
        )}
      </div>

      <Modal
        title={`Set temporary password${selectedUser?.email ? ` for ${selectedUser.email}` : ""}`}
        open={Boolean(selectedUser)}
        onCancel={() => {
          setSelectedUser(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <p className="mb-4 text-sm text-gray-600">
          Share the password with the user privately. It remains active until changed again; do not send it in a public channel.
        </p>
        <Form form={form} layout="vertical" onFinish={handlePasswordReset}>
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

  if (!currentUser) {
    return <Login adminLogin />;
  }

  return <AdminPanel currentUser={currentUser} logout={logout} />;
}
