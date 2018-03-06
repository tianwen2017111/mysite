package dev;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Random;

public class ExtractFeature {
	private static int devNum = new File("Router").listFiles().length;

	private static final double MAX = 10;
	private static final int window_size = 500;
	private static final int bins = 25;
	private static double[] mins = new double[bins+1];
	private static 	double[] width = new double[bins+1];
	
	private static int dataLength[] = new int[devNum];
	private static int[] getDataLength() {
		return dataLength;
	}

	private static void setDataLength(int[] dataLength) {
		ExtractFeature.dataLength = dataLength;
	}
	/**
	 * 读取 /Data文件夹下的数据集, 提取特征，输出到 /Feature 文件夹下
	 * Data文件夹下数据为 txt
	 */
	private static void extract() {
			// TODO Auto-generated method stub
			File[] files = new File("Router").listFiles();
			FileUtil.deleteRecursive(new File("Feature"));
			FileUtil.deleteRecursive(new File("Samples"));
			
			int temDataLength[] = new int[devNum];
			int index = 0;
			for (File file : files) {
				if (!file.getName().endsWith("txt")) {
					continue;
				}
				try {
					BufferedReader br = new BufferedReader(new FileReader(file));
					String line = br.readLine().trim();
					ArrayList<Double> deltaTimeList = new ArrayList<Double>();
					System.out.println(file.getName());
					while (line != null && line.length() > 0) {
						double value = Double.parseDouble(line);
						if (value < MAX) {
							deltaTimeList.add(value);
						}
						
						line = br.readLine();
						if (line == null) {
							break;
						}
						line = line.trim();
					}
					Collections.shuffle(deltaTimeList);  //将list daltaTimeList打乱顺序
					Double[] temp = (Double[]) deltaTimeList.toArray(new Double[deltaTimeList.size()]);
					
					temDataLength[index] = deltaTimeList.size()/window_size; //记录每个文件数据长度
					index++;
					double[] deltaTime = new double[temp.length];
					for (int i = 0; i < deltaTime.length; i++) {
						deltaTime[i] = temp[i].doubleValue();
					}
//					getSample(deltaTime, file); //get a random sample data
					for (int i = 0; i + window_size < deltaTime.length; i += window_size/2) {
						
						FileWriter fw = new FileWriter(FileUtil.openOrCreateFile("Feature", file.getName()), true);
						BufferedWriter bw = new BufferedWriter(fw);
						
						for (double d : Arrays.copyOfRange(deltaTime, i, i + window_size)) {
							bw.write(d + " ");

						}
						bw.newLine();
						
						bw.close();
						fw.close();
					}
					br.close();
				}catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
			setDataLength(temDataLength); //获取数据长度
		}
	
	public static ArrayList<double[]> getListFromFiles(File[] files){
		ArrayList<double[]> dataAll = new ArrayList<double[]>();
		try{
			int deviceID = 1;
			for (File file : files) {

				BufferedReader br = new BufferedReader(new FileReader(file));				
				String line = null;
				
				while ((line = br.readLine()) != null) {
					String[] values = line.split(" ");
					double[] sample = new double[values.length];
					ArrayList<Integer> list = new ArrayList<Integer>();
					
					for (int i = 0; i < sample.length; i++) {
						sample[i] = Double.parseDouble(values[i]);
					}
					double min = MathUtil.minValueOf(sample);
					double max = MathUtil.maxValueOf(sample);
					double binwidth = (max - min)/bins;
					for(int i = 0;i<sample.length;i++ ){
						list.add((int)((sample[i]-min)/binwidth));
					}
					double[] vector = new double[bins+1];
						double count = 0 ;
					for(int i = 0 ;i<vector.length - 1;i++){
						vector[i] = Collections.frequency(list
								,(Object)new Integer(i))/(double)list.size();
							count += vector[i];
					}
					vector[bins] = deviceID;
				
					dataAll.add(vector);
			}
			deviceID ++;
			br.close();
		}
		}catch(Exception e){
			e.printStackTrace();
		}
		return dataAll;
	}
	
	/**
	 * 
	 * @param filename 输出文件名，为 Train.txt 或者 Test.txt
	 * @param start 选择处理数据数据
	 * @param end 选择处理数据数据
	 */
	
	private static void refactor(String filename, int begin,
			int[] interval,ArrayList<double[]> dataList) {
		ArrayList<double []> dataAll = new ArrayList<double []>();
		int count = 0 ;
		double deviceId = 1;
		for(int i=0;i < dataList.size();i++){
			int start = begin * interval[(int)deviceId-1];			//对每个文件分别设置间隔
			int end = (begin + 1) * interval[(int)deviceId-1];
			if(count>=start & count <=end){
				double[] vector = new double[dataList.get(i).length];
				for(int j=0;j<dataList.get(i).length;j++){
					vector[j] = dataList.get(i)[j];
				}
				dataAll.add(vector);
			}
			count ++;
			if(deviceId != dataList.get(i)[bins]){
				count = 0;
				deviceId = dataList.get(i)[bins];
			}
		}
		
		try {
			
			File f = FileUtil.openOrCreateFile(filename + ".txt");
			FileWriter fw = new FileWriter(f, true);
			BufferedWriter bw = new BufferedWriter(fw);
		
			if ("Train".equals(filename)) {
				double[][] processing = MathUtil.listToMatrix(dataAll).transpose().getArray();
				for (int i = 0; i < width.length; i++) {
					mins[i] = MathUtil.min(processing[i]);
					width[i] = MathUtil.max(processing[i]) - MathUtil.min(processing[i]);
				}
			}else if("Test".equals(filename)) {
				
			}
			else {
				System.out.println("parameter error");
			}
			int j = 0;
			for (int i = 0; i < dataAll.size(); i++) {
				for (j = 0; j < dataAll.get(i).length - 1; j ++) {
					if(width[j] != 0){
						dataAll.get(i)[j] = (dataAll.get(i)[j]-mins[j])/width[j];
					}
//					else{
//						dataAll.get(i)[j] = 0.75;	//该统计量为定值，设置为定值0.75
//					}
					bw.write(dataAll.get(i)[j]+",");
				}
				bw.write((int)dataAll.get(i)[j]+ "\n");
			}
			bw.close();
			fw.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}catch (NumberFormatException e) {
			// TODO: handle exception
			e.printStackTrace();
		}
	}
	public static void getSample(double [] deltaTime,File file ){
			int random = new Random().nextInt(deltaTime.length/window_size-1);
			FileWriter fw;
			try {
				fw = new FileWriter(FileUtil.openOrCreateFile("Samples", file.getName()), true);
				BufferedWriter bw = new BufferedWriter(fw);
				for(int i = random*window_size;i < (random+1)*window_size;i++){
					bw.write(deltaTime[i]+" ");
					bw.newLine();
				}
				bw.close();
				fw.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			System.out.println("A sample got success.");
			
		}
	
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		extract();
		File[] files = new File("Feature").listFiles();
		ArrayList<double[]> dataAll = getListFromFiles(files);
		int inteval[] = new int[devNum];
		for(int i =0;i<devNum;i++){
			inteval[i] = getDataLength()[i]/10;
			System.out.println("Data Length"+i+":"+inteval[i]);
		}
	 for(int i = 9;i<10;i++){
		new File("Train.txt").delete();
		new File("Test.txt").delete();
		for(int j=0;j<10;j++){
			if(j != i ){
				refactor("Train", j,inteval,dataAll);
			}
			else{
				refactor("Test", j, inteval,dataAll);
			}
		}
//		refactor("Test", i, inteval,dataAll);
		
//		GtidClassify.randomForest();
//		GtidClassify.svm();
//		GtidClassify.knn();
//		GtidClassify.bayes();
//		GtidClassify.ANN();
	}
	}

}
