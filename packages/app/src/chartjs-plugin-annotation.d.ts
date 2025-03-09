import "chartjs-plugin-annotation";

declare module "chart.js" {
  interface ChartOptions {
    annotation?: {
      drawTime?: string;
      annotations: Array<{
        type: string;
        mode: string;
        scaleID: string;
        value: number;
        borderColor: string;
        borderWidth: number;
        borderDash: number[];
        borderDashOffset: number;
        label: {
          enabled: boolean;
        };
      }>;
    };
  }
}
