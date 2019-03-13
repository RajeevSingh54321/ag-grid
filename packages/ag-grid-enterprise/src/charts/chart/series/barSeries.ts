import {StackedCartesianSeries} from "./stackedCartesianSeries";
import {Group} from "../../scene/group";
import {Selection} from "../../scene/selection";
import {CartesianChart} from "../cartesianChart";
import {Rect} from "../../scene/shape/rect";
import {Text} from "../../scene/shape/text";
import {BandScale} from "../../scale/bandScale";
import {DropShadow} from "../../scene/dropShadow";

type BarDatum = {
    x: number,
    y: number,
    width: number,
    height: number,
    fillStyle: string,
    strokeStyle: string,
    lineWidth: number,
    label: string
};

enum BarSeriesNodeTag {
    Bar,
    Label
}

export class BarSeries<D, X = string, Y = number> extends StackedCartesianSeries<D, X, Y> {
    set chart(chart: CartesianChart<D, X, Y> | null) {
        if (this._chart !== chart) {
            this._chart = chart;
            this.update();
        }
    }
    get chart(): CartesianChart<D, X, Y> | null {
        return this._chart as CartesianChart<D, X, Y>;
    }

    private _data: any[] = [];
    set data(data: any[]) {
        this._data = data;
        if (this.processData()) {
            this.update();
        }
    }
    get data(): any[] {
        return this._data;
    }

    set xField(value: Extract<keyof D, string> | null) {
        if (this._xField !== value) {
            this._xField = value;
            if (this.processData()) {
                this.update();
            }
        }
    }
    get xField(): Extract<keyof D, string> | null {
        return this._xField;
    }

    /**
     * With a single value in the `yFields` array we get the regular bar series.
     * With multiple values, we get the stacked bar series.
     * If the {@link isGrouped} set to `true`, we get the grouped bar series.
     * @param values
     */
    set yFields(values: Extract<keyof D, string>[]) {
        this._yFields = values;

        const groupScale = this.groupScale;
        groupScale.domain = values;
        groupScale.padding = 0.1;
        groupScale.round = true;

        if (this.processData()) {
            this.update();
        }
    }
    get yFields(): Extract<keyof D, string>[] {
        return this._yFields;
    }

    /**
     * If the type of series datum is declared as `any`, one can change the values of the
     * {@link data}, {@link xField} and {@link yFields} configs on the fly, where the type
     * of data and the fields names are completely different from ones currently in use by
     * the series. This can lead to a situation where one sets the new {@link data},
     * which triggers the series to fetch the fields from the datums, but the
     * datums have no such fields. Conversely, one can set the new {@link xField} or {@link yFields}
     * that are not present in the current {@link data}.
     * In such cases, the {@link data}, {@link xField} and {@link yFields} configs have to be set
     * simultaneously, as an atomic operation.
     * @param data
     * @param xField
     * @param yFields
     */
    setDataAndFields(data: any[], xField: Extract<keyof D, string>, yFields: Extract<keyof D, string>[]) {
        this._xField = xField;
        this._yFields = yFields;
        this._data = data;

        const groupScale = this.groupScale;
        groupScale.domain = yFields;
        groupScale.padding = 0.1;
        groupScale.round = true;

        if (this.processData()) {
            this.update();
        }
    }

    set yFieldNames(values: string[]) {
        this._yFieldNames = values;
        this.update();
    }
    get yFieldNames(): string[] {
        return this._yFieldNames;
    }

    private _isGrouped: boolean = false;
    set isGrouped(value: boolean) {
        if (this._isGrouped !== value) {
            this._isGrouped = value;
            if (this.processData()) {
                this.update();
            }
        }
    }
    get isGrouped(): boolean {
        return this._isGrouped;
    }

    private _strokeStyle: string = 'black';
    set strokeStyle(value: string) {
        if (this._strokeStyle !== value) {
            this._strokeStyle = value;
            this.update();
        }
    }
    get strokeStyle(): string {
        return this._strokeStyle;
    }

    private _lineWidth: number = 1;
    set lineWidth(value: number) {
        if (this._lineWidth !== value) {
            this._lineWidth = value;
            this.update();
        }
    }
    get lineWidth(): number {
        return this._lineWidth;
    }

    private _shadow: DropShadow | null = null;
    set shadow(value: DropShadow | null) {
        if (this._shadow !== value) {
            this._shadow = value;
            this.update();
        }
    }
    get shadow(): DropShadow | null {
        return this._shadow;
    }

    private domainX: X[] = [];
    private domainY: Y[] = [];
    private yData: number[][] = [];

    /**
     * Used to get the position of bars within each group.
     */
    private groupScale = new BandScale<string>();

    processData(): boolean {
        const data = this.data;
        const n = data.length;
        const xField = this.xField;
        const yFields = this.yFields;
        const yFieldCount = yFields.length;

        if (!(n && xField && yFieldCount)) {
            return false;
        }

        // If the data is an array of rows like so:
        //
        // [{
        //   xField: 'Jan',
        //   yField1: 5,
        //   yField2: 7,
        //   yField3: -9,
        // }, {
        //   xField: 'Feb',
        //   yField1: 10,
        //   yField2: -15,
        //   yField3: 20
        // }]
        //
        const xData: X[] = this.domainX = data.map(datum => {
            const value = datum[xField];
            if (typeof value !== 'string') {
                throw new Error(`The ${xField} value is not a string. `
                    + `This error might be solved by using the 'setDataAndFields' method.`);
            }
            return value as unknown as X;
        });
        const yData: number[][] = this.yData = data.map(datum => {
            const values: number[] = [];
            yFields.forEach(field => {
                const value = datum[field];
                if (isNaN(value)) {
                    throw new Error(`The ${field} value is not a number. `
                        + `This error might be solved by using the 'setDataAndFields' method.`);
                }
                values.push(value);
            });
            return values;
        });

        // xData: ['Jan', 'Feb']
        //
        // yData: [
        //   [5, 7, -9],
        //   [10, -15, 20]
        // ]

        let yMin: number = Infinity;
        let yMax: number = -Infinity;

        if (this.isGrouped) {
            // Find the tallest positive/negative bar in each group,
            // then find the tallest positive/negative bar overall.
            // The `yMin` should always be <= 0,
            // otherwise with the `yData` like [300, 200, 100] the last bar
            // will have zero height, because the y-axis range is [100, 300].
            yMin = Math.min(...yData.map(groupValues => Math.min(0, ...groupValues)));
            yMax = Math.max(...yData.map(groupValues => Math.max(...groupValues)));
        } else { // stacked or regular
            // Find the height of each stack in the positive and negative directions,
            // then find the tallest stacks in both directions.
            yMin = Math.min(0, ...yData.map(stackValues => {
                let min = 0;
                stackValues.forEach(value => {
                    if (value < 0) {
                        min -= value;
                    }
                });
                return min;
            }));
            yMax = Math.max(...yData.map(stackValues => {
                let max = 0;
                stackValues.forEach(value => {
                    if (value > 0) {
                        max += value;
                    }
                });
                return max;
            }));
        }

        this.domainX = xData;
        this.domainY = [yMin, yMax] as unknown as Y[];

        const chart = this.chart;
        if (chart) {
            chart.updateAxes();
        }

        return true;
    }

    getDomainX(): X[] {
        return this.domainX;
    }

    getDomainY(): Y[] {
        return this.domainY;
    }

    /**
     * The selection of Group elements, each containing a Rect (bar) and a Text (label) nodes.
     */
    private groupSelection: Selection<Group, Group, any, any> = Selection.select(this.group).selectAll<Group>();

    colors: string[] = [
        '#5BC0EB',
        '#FDE74C',
        '#9BC53D',
        '#E55934',
        '#FA7921',
        '#fa3081'
    ];

    update(): void {
        const chart = this.chart;

        if (!chart || chart && chart.isLayoutPending || !(chart.xAxis && chart.yAxis)) {
            return;
        }

        const n = this.data.length;
        const xAxis = chart.xAxis;
        const yAxis = chart.yAxis;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const groupScale = this.groupScale;
        const yFields = this.yFields;
        const colors = this.colors;
        const isGrouped = this.isGrouped;
        const strokeStyle = this.strokeStyle;
        const lineWidth = this.lineWidth;

        groupScale.range = [0, xScale.bandwidth!];
        const barWidth = isGrouped ? groupScale.bandwidth! : xScale.bandwidth!;

        const barData: BarDatum[] = [];

        for (let i = 0; i < n; i++) {
            const category = this.domainX[i];
            const values = this.yData[i];
            const x = xScale.convert(category);
            let yFieldIndex = 0;
            values.reduce((prev, curr) => {
                const y0 = yScale.convert((isGrouped ? 0 : prev) as unknown as Y);
                const y1 = yScale.convert((isGrouped ? curr : prev + curr) as unknown as Y);
                const color = colors[yFieldIndex % colors.length];
                barData.push({
                    x: x + (isGrouped ? groupScale.convert(yFields[yFieldIndex]) : 0),
                    y: y1,
                    width: barWidth,
                    height: y0 - y1,
                    fillStyle: color,
                    strokeStyle,
                    lineWidth,
                    label: this.yFieldNames[yFieldIndex]
                });

                yFieldIndex++;
                return isGrouped ? curr : curr + prev;
            }, 0);
        }

        const updateGroups = this.groupSelection.setData(barData);
        updateGroups.exit.remove();

        const enterGroups = updateGroups.enter.append(Group);
        enterGroups.append(Rect).each(rect => {
            rect.tag = BarSeriesNodeTag.Bar;
            rect.isCrisp = true;
        });
        enterGroups.append(Text).each(text => text.tag = BarSeriesNodeTag.Label);

        const groupSelection = updateGroups.merge(enterGroups);

        groupSelection.selectByTag<Rect>(BarSeriesNodeTag.Bar)
            .each((rect, datum) => {
                rect.x = datum.x;
                rect.y = datum.y;
                rect.width = datum.width;
                rect.height = datum.height;
                rect.fillStyle = datum.fillStyle;
                rect.strokeStyle = datum.strokeStyle;
                rect.lineWidth = datum.lineWidth;
                rect.shadow = this.shadow;
            });

        groupSelection.selectByTag<Text>(BarSeriesNodeTag.Label)
            .each((text, datum) => {
                if (datum.label) {
                    text.text = datum.label;
                    text.textAlign = 'center';
                    text.x = datum.x + datum.width / 2;
                    text.y = datum.y + 20;
                    text.fillStyle = 'black';
                    text.font = '14px Verdana';
                    text.isVisible = true;
                } else {
                    text.isVisible = false;
                }
            });

        this.groupSelection = groupSelection;
    }
}