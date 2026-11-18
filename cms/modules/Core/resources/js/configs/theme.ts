import type { ThemeConfig } from 'antd';

export const UREKA_COLORS = {
	primary: '#EA088B',
	primaryHover: '#F238A3',
	primaryActive: '#C40674',
	purple: '#652E8D',
	info: '#0999D6',
	success: '#74BE44',
	warning: '#F79420',
	error: '#ED3325',
	dark: '#221F1F',
	siderBg: '#1A161F',
	gradientPrimary: 'linear-gradient(135deg, #EA088B 0%, #652E8D 55%, #0999D6 100%)',
} as const;

export const UREKA_FONT_FAMILY =
	"'Plus Jakarta Sans', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const doohTheme: ThemeConfig = {
	token: {
		colorPrimary: UREKA_COLORS.primary,
		colorInfo: UREKA_COLORS.info,
		colorSuccess: UREKA_COLORS.success,
		colorWarning: UREKA_COLORS.warning,
		colorError: UREKA_COLORS.error,
		colorTextBase: UREKA_COLORS.dark,
		colorLink: UREKA_COLORS.primary,
		colorLinkHover: UREKA_COLORS.primaryHover,
		borderRadius: 8,
		fontFamily: UREKA_FONT_FAMILY,
	},
	components: {
		Layout: {
			siderBg: UREKA_COLORS.siderBg,
			headerBg: '#ffffff',
		},
		Menu: {
			darkItemBg: UREKA_COLORS.siderBg,
			darkSubMenuItemBg: '#131017',
			darkItemSelectedBg: UREKA_COLORS.primary,
		},
		Table: {
			headerBg: '#fafafa',
			headerColor: UREKA_COLORS.dark,
		},
	},
};
