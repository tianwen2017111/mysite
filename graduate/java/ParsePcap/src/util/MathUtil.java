package util;


import java.math.BigDecimal;
import java.util.ArrayList;

import org.apache.commons.math3.stat.descriptive.moment.Kurtosis;
import org.apache.commons.math3.stat.descriptive.moment.Mean;
import org.apache.commons.math3.stat.descriptive.moment.Skewness;
import org.apache.commons.math3.stat.descriptive.moment.StandardDeviation;
import org.apache.commons.math3.stat.descriptive.moment.Variance;
import org.apache.commons.math3.stat.descriptive.rank.Max;
import org.apache.commons.math3.stat.descriptive.rank.Min;
import org.apache.commons.math3.stat.descriptive.rank.Percentile;

import Jama.Matrix;

public class MathUtil {
	
	private static Mean mean = new Mean();
    private static Min min = new Min();
    private static Max max = new Max();
    private static Variance variance = new Variance();
    private static StandardDeviation standardDeviation = new StandardDeviation();
    private static Percentile percentile = new Percentile();
    private static Skewness skewness = new Skewness(); 
    private static Kurtosis kurtosis = new Kurtosis();

	public static double meanValue(double[] array) {

		return mean.evaluate(array);
	}
	
	/**
     * ���� double�����������Сֵ
     * @param values
     * @return
     */
    public static double minValueOf(double[] values) {
        return min.evaluate(values);
    }

    /**
     * ���� double������������ֵ
     * @param values
     * @return
     */
    public static double maxValueOf(double[] values) {
        return max.evaluate(values);
    }
	
    /**
     * ���� double�����������λ��
     * @param values
     * @return
     */
    public static double medianValueOf(double[] values) {
        return percentile.evaluate(values);
    }


    /**
     * ���� double����������ķ�λ��
     * @param values
     * @return
     */
    public static double quartileDeviationValueOf(double[] values) {
        return percentile.evaluate(values,75.0) - percentile.evaluate(values,25.0);
    }

    /**
     * ���� double���������ƫ��
     * @param values
     * @return
     */
    public static double skewnessValueOf(double[] values) {
        return skewness.evaluate(values);
    }

    /**
     * ���� double��������ķ��
     * @param values
     * @return
     */
    public static double kurtosis(double[] values) {
        return kurtosis.evaluate(values);
    }
    
    /**
     * 
     * @param array
     * @return
     */
	public static double standardDeviation(double[] array) {
		
		return standardDeviation.evaluate(array);
	}
	
	/**
     * ���� double��������ķ���
     * @param values
     * @return
     */
    public static double varianceValueOf(double[] values) {
        return variance.evaluate(values);
    }

	public static double[] histogram(double[] array, double min, double max, int numberOfBins) {
		
		double[] hist = new double[numberOfBins];
		double width = (max - min)/numberOfBins;
		
		for (int i = 0; i < array.length; i++) {
			
			if ((array[i] - min)/width < numberOfBins) {
				hist[(int) ((array[i] - min)/width)] ++;
			}
			
		}
		return hist;
	}
	
	/**
     * �� double ���͸������ݽ��б���4λС������
     * @param v
     * @return
     */
    public static double format(double v) throws NumberFormatException{
    	BigDecimal b = new BigDecimal(v);
		return b.setScale(4, BigDecimal.ROUND_HALF_UP).doubleValue();
	}
    
    public static Matrix listToMatrix(ArrayList<double[]> data) {
    	
		double[][] array = new double[data.size()][data.get(0).length];
		for (int i = 0; i < array.length; i++) {
			array[i] = data.get(i);
		}
		return new Matrix(array);
	}
    
    public static double max(double[] v) {
		
    	double ret = v[0];
    	for (double d : v) {
			ret = Math.max(ret, d);
		}
    	return ret;
	}
    
    public static double min(double[] v) {
		
    	double ret = v[0];
    	for (double d : v) {
			ret = Math.min(ret, d);
		}
    	return ret;
	}
    
    
}
