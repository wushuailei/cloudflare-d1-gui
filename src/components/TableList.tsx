import { useState, useEffect } from 'react';
import { Menu, Input, Spin, Empty, message } from 'antd';
import { TableOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableInfo, DatabaseConnection } from '../types';
import { apiService } from '../services/api';

interface TableListProps {
  connection?: DatabaseConnection;
  onTableSelect: (tableName: string) => void;
  selectedTable?: string;
  refreshTrigger?: number;
}

export default function TableList({
  connection,
  onTableSelect,
  selectedTable,
  refreshTrigger,
}: TableListProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadTables();
  }, [connection, refreshTrigger]);

  useEffect(() => {
    if (searchText) {
      const filtered = tables.filter((table) =>
        table.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredTables(filtered);
    } else {
      setFilteredTables(tables);
    }
  }, [searchText, tables]);

  const loadTables = async () => {
    if (!connection) {
      setTables([]);
      setFilteredTables([]);
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.getTables(connection);
      if (result.success && result.data) {
        setTables(result.data);
        setFilteredTables(result.data);
      } else {
        message.error(result.error || '加载表列表失败');
        setTables([]);
        setFilteredTables([]);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      message.error('加载表列表失败');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = filteredTables.map((table) => ({
    key: table.name,
    icon: <TableOutlined />,
    label: table.name,
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          placeholder="搜索表..."
          prefix={<SearchOutlined />}
          suffix={
            <ReloadOutlined
              onClick={loadTables}
              style={{ cursor: 'pointer', color: '#1890ff' }}
            />
          }
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin tip="加载中..." />
          </div>
        ) : filteredTables.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              connection
                ? searchText
                  ? '没有找到匹配的表'
                  : '数据库中没有表'
                : '请先选择数据库连接'
            }
            style={{ marginTop: 60 }}
          />
        ) : (
          <Menu
            mode="inline"
            selectedKeys={selectedTable ? [selectedTable] : []}
            items={menuItems}
            onClick={({ key }) => onTableSelect(key)}
            style={{ border: 'none' }}
          />
        )}
      </div>

      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          fontSize: 12,
          color: '#999',
        }}
      >
        共 {filteredTables.length} 个表
      </div>
    </div>
  );
}
