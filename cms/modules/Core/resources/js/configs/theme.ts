import type { ThemeConfig } from 'antd';

export const doohTheme: ThemeConfig = {
    token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    components: {
        Layout: {
            siderBg: '#001529',
            headerBg: '#ffffff',
        },
        Table: {
            headerBg: '#fafafa',
            headerColor: 'rgba(0, 0, 0, 0.88)',
        },
    },
};
