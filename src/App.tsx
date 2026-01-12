import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Tag, Dropdown, message } from 'antd';
import {
  DatabaseOutlined,
  CodeOutlined,
  TableOutlined,
  SettingOutlined,
  CloudServerOutlined,
  LaptopOutlined,
  DownOutlined,
} from '@ant-design/icons';
import DatabaseConfig from './components/DatabaseConfig';
import TableList from './components/TableList';
import SqlEditor from './components/SqlEditor';
import TableView from './components/TableView';
import { configService } from './services/config';
import type { DatabaseConnection } from './types';
import './App.css';

const { Header, Sider, Content } = Layout;

type ViewMode = 'sql' | 'table';

function App() {
  const [configVisible, setConfigVisible] = useState(false);
  const [connection, setConnection] = useState<DatabaseConnection | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('sql');
  const [selectedTable, setSelectedTable] = useState<string | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadActiveConnection();
  }, []);

  const loadActiveConnection = () => {
    const activeConn = configService.getActiveConnection();
    setConnection(activeConn);
  };

  const handleConnectionChange = () => {
    loadActiveConnection();
    setRefreshTrigger((prev) => prev + 1);
    message.success('连接已切换');
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setViewMode('table');
  };

  const connectionMenuItems = [
    {
      key: 'config',
      label: '管理连接',
      icon: <SettingOutlined />,
      onClick: () => setConfigVisible(true),
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Header */}
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space size="large">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DatabaseOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <h1 style={{ margin: 0, fontSize: 20 }}>Cloudflare D1 数据库管理</h1>
          </div>

          {connection && (
            <Tag
              icon={
                connection.mode === 'local' ? (
                  <LaptopOutlined />
                ) : (
                  <CloudServerOutlined />
                )
              }
              color={connection.mode === 'local' ? 'blue' : 'green'}
            >
              {connection.name}
            </Tag>
          )}
        </Space>

        <Space>
          <Menu
            mode="horizontal"
            selectedKeys={[viewMode]}
            items={[
              {
                key: 'sql',
                icon: <CodeOutlined />,
                label: 'SQL 编辑器',
              },
              {
                key: 'table',
                icon: <TableOutlined />,
                label: '表数据',
                disabled: !selectedTable,
              },
            ]}
            onClick={({ key }) => setViewMode(key as ViewMode)}
            style={{ border: 'none', minWidth: 200 }}
          />

          <Dropdown menu={{ items: connectionMenuItems }} placement="bottomRight">
            <Button type="primary">
              <Space>
                <DatabaseOutlined />
                数据库连接
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </Space>
      </Header>

      <Layout>
        {/* Sidebar - Table List */}
        <Sider
          width={250}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <TableList
            connection={connection}
            onTableSelect={handleTableSelect}
            selectedTable={selectedTable}
            refreshTrigger={refreshTrigger}
          />
        </Sider>

        {/* Main Content */}
        <Content
          style={{
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          {viewMode === 'sql' ? (
            <SqlEditor connection={connection} />
          ) : selectedTable ? (
            <TableView tableName={selectedTable} connection={connection} />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#999',
              }}
            >
              请从左侧选择一个表
            </div>
          )}
        </Content>
      </Layout>

      {/* Database Config Modal */}
      <DatabaseConfig
        visible={configVisible}
        onClose={() => setConfigVisible(false)}
        onConnectionChange={handleConnectionChange}
      />
    </Layout>
  );
}

export default App;
