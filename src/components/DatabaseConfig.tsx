import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  message,
  Radio,
  Divider,
  Card,
  List,
  Popconfirm,
} from 'antd';
import {
  DatabaseOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudServerOutlined,
  LaptopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { DatabaseConnection } from '../types';
import { configService } from '../services/config';
import { apiService } from '../services/api';

interface DatabaseConfigProps {
  visible: boolean;
  onClose: () => void;
  onConnectionChange: () => void;
}

export default function DatabaseConfig({
  visible,
  onClose,
  onConnectionChange,
}: DatabaseConfigProps) {
  const [form] = Form.useForm();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [mode, setMode] = useState<'local' | 'remote'>('local');

  useEffect(() => {
    if (visible) {
      loadConnections();
    }
  }, [visible]);

  const loadConnections = () => {
    const config = configService.getConfig();
    setConnections(config.connections);
    setActiveId(config.activeConnectionId);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const connection: DatabaseConnection = {
        id: editingId || `conn-${Date.now()}`,
        name: values.name,
        mode: values.mode,
        description: values.description,
        accountId: values.mode === 'remote' ? values.accountId : undefined,
        apiToken: values.mode === 'remote' ? values.apiToken : undefined,
        databaseId: values.mode === 'remote' ? values.databaseId : undefined,
      };

      if (editingId) {
        configService.updateConnection(editingId, connection);
        message.success('连接已更新');
      } else {
        configService.addConnection(connection);
        message.success('连接已添加');
      }

      loadConnections();
      handleCancel();
      onConnectionChange();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      if (values.mode === 'local') {
        message.success('本地模式无需测试');
        return;
      }

      setTesting(true);
      const testConnection: DatabaseConnection = {
        id: 'test',
        name: 'test',
        mode: 'remote',
        accountId: values.accountId,
        apiToken: values.apiToken,
        databaseId: values.databaseId,
      };

      const result = await apiService.testConnection(testConnection);
      if (result.success) {
        message.success('连接测试成功！');
      } else {
        message.error(`连接测试失败：${result.error}`);
      }
    } catch {
      message.error('请先填写完整的连接信息');
    } finally {
      setTesting(false);
    }
  };

  const handleEdit = (connection: DatabaseConnection) => {
    setEditingId(connection.id);
    setMode(connection.mode);
    form.setFieldsValue(connection);
  };

  const handleDelete = (id: string) => {
    try {
      configService.deleteConnection(id);
      message.success('连接已删除');
      loadConnections();
      onConnectionChange();
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const handleSetActive = (id: string) => {
    configService.setActiveConnection(id);
    setActiveId(id);
    message.success('已切换连接');
    onConnectionChange();
  };

  const handleCancel = () => {
    setEditingId(null);
    form.resetFields();
    setMode('local');
  };

  const handleModeChange = (value: 'local' | 'remote') => {
    setMode(value);
  };

  return (
    <Modal
      title={<Space><DatabaseOutlined /> 数据库连接管理</Space>}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Card
          title={editingId ? '编辑连接' : '新建连接'}
          size="small"
          extra={
            editingId && (
              <Button size="small" onClick={handleCancel}>
                取消编辑
              </Button>
            )
          }
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="连接模式"
              name="mode"
              initialValue="local"
              rules={[{ required: true }]}
            >
              <Radio.Group onChange={(e) => handleModeChange(e.target.value)}>
                <Radio.Button value="local">
                  <Space>
                    <LaptopOutlined />
                    本地开发
                  </Space>
                </Radio.Button>
                <Radio.Button value="remote">
                  <Space>
                    <CloudServerOutlined />
                    远程管理
                  </Space>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="连接名称"
              name="name"
              rules={[{ required: true, message: '请输入连接名称' }]}
            >
              <Input placeholder="例如：生产环境数据库" />
            </Form.Item>

            <Form.Item label="描述" name="description">
              <Input.TextArea rows={2} placeholder="可选的连接描述" />
            </Form.Item>

            {mode === 'remote' && (
              <>
                <Divider>远程连接配置</Divider>
                <Form.Item
                  label="Account ID"
                  name="accountId"
                  rules={[{ required: true, message: '请输入 Account ID' }]}
                >
                  <Input placeholder="Cloudflare Account ID" />
                </Form.Item>

                <Form.Item
                  label="API Token"
                  name="apiToken"
                  rules={[{ required: true, message: '请输入 API Token' }]}
                >
                  <Input.Password placeholder="Cloudflare API Token" />
                </Form.Item>

                <Form.Item
                  label="Database ID"
                  name="databaseId"
                  rules={[{ required: true, message: '请输入 Database ID' }]}
                >
                  <Input placeholder="D1 Database ID" />
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleSave}>
                  {editingId ? '更新' : '添加'}
                </Button>
                {mode === 'remote' && (
                  <Button onClick={handleTest} loading={testing}>
                    测试连接
                  </Button>
                )}
                {editingId && (
                  <Button onClick={handleCancel}>取消</Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <Card title="已保存的连接" size="small">
        <List
          dataSource={connections}
          renderItem={(conn) => (
            <List.Item
              actions={[
                conn.id === activeId ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                ) : (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleSetActive(conn.id)}
                  >
                    使用
                  </Button>
                ),
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(conn)}
                >
                  编辑
                </Button>,
                conn.id !== 'local-dev' && (
                  <Popconfirm
                    title="确定要删除这个连接吗？"
                    onConfirm={() => handleDelete(conn.id)}
                  >
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={
                  conn.mode === 'local' ? (
                    <LaptopOutlined style={{ fontSize: 24 }} />
                  ) : (
                    <CloudServerOutlined style={{ fontSize: 24 }} />
                  )
                }
                title={
                  <Space>
                    {conn.name}
                    {conn.id === activeId && (
                      <span style={{ color: '#52c41a', fontSize: 12 }}>
                        (当前)
                      </span>
                    )}
                  </Space>
                }
                description={conn.description || `${conn.mode === 'local' ? '本地' : '远程'}连接`}
              />
            </List.Item>
          )}
        />
      </Card>
    </Modal>
  );
}
