import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Form, Modal, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { LayoutDashboard } from "lucide-react";

export default function Login({ onSwitchToSignup, adminLogin = false }) {
  const { login, resetPassword } = useAuth();
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  async function handleSubmit(values) {
    try {
      setLoading(true);
      await login(values.email, values.password);
      message.success("Successfully logged in!");
    } catch (error) {
      console.error(error);
      message.error("Failed to log in: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset({ email }) {
    try {
      setResetLoading(true);
      await resetPassword(email);
      message.success("If an account exists for this email, a password reset link has been sent.");
      setResetModalOpen(false);
      resetForm.resetFields();
    } catch (error) {
      console.error(error);
      message.error("Could not send the password reset email: " + error.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <LayoutDashboard size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {adminLogin ? "Admin Login" : "Welcome Back"}
            </h2>
            <p className="text-gray-500 mt-2">
              {adminLogin ? "Authorized administrator access only" : "Log in to your workspace"}
            </p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Please input your Email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Email Address"
                className="rounded-lg h-12"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Please input your Password!" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Password"
                className="rounded-lg h-12"
              />
            </Form.Item>

            <Form.Item className="-mt-5 text-right">
              <Button
                type="link"
                htmlType="button"
                onClick={() => setResetModalOpen(true)}
                className="px-0"
              >
                Forgot password?
              </Button>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 shadow-md font-semibold text-lg"
                loading={loading}
              >
                Log In
              </Button>
            </Form.Item>
          </Form>

          <Modal
            title="Reset your password"
            open={resetModalOpen}
            onCancel={() => setResetModalOpen(false)}
            footer={null}
            destroyOnClose
          >
            <p className="mb-4 text-gray-500">
              Enter your account email and we’ll send you a password reset link.
            </p>
            <Form
              form={resetForm}
              name="password-reset"
              onFinish={handlePasswordReset}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please input your Email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Email Address"
                  className="rounded-lg h-12"
                />
              </Form.Item>
              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={resetLoading}
                  className="w-full h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold"
                >
                  Send reset link
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {!adminLogin && (
            <div className="text-center mt-6">
              <span className="text-gray-500">Don't have an account? </span>
              <button
                onClick={onSwitchToSignup}
                className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
