import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Form, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { LayoutDashboard } from "lucide-react";

export default function Login({ onSwitchToSignup }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
              <LayoutDashboard size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Log in to your workspace</p>
          </div>

          <Form
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

          <div className="text-center mt-6">
            <span className="text-gray-500">Don't have an account? </span>
            <button
              onClick={onSwitchToSignup}
              className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
