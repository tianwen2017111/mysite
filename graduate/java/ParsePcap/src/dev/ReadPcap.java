package dev;


import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

import org.jnetpcap.Pcap;
import org.jnetpcap.PcapHeader;
import org.jnetpcap.nio.JBuffer;
import org.jnetpcap.nio.JMemory;
import org.jnetpcap.packet.JRegistry;
import org.jnetpcap.packet.PcapPacket;
import org.jnetpcap.protocol.lan.Ethernet;
import org.jnetpcap.protocol.tcpip.Tcp;


public class ReadPcap {
	static long lastTime = 0;
	static double transRate = 0;
	static long lastNumber = 0;

	public static void outputToFile(String filename, long frameno,long time,double IAT,int size,double rate){
		File frameInfoFile = new File(filename);
		
		try {
			frameInfoFile.createNewFile();
			FileWriter writer = new FileWriter(frameInfoFile, true);   
			String strFrame = String.format("Frame No: %-4d, Epoch Time = %d , IAT = %f ,"
					+ "Frame Size = %-4d ,Trans Rate = %f  \n",
					frameno,time,IAT,size,rate);
			writer.write(strFrame);
			writer.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	} 
	
	public static void readPcap(String filename, String outputFilename){
		StringBuilder errbuf = new StringBuilder(); //For any error msgs
		
		/*------------------------ 打开文件 ------------------------*/  
		System.out.println(Thread.currentThread().getStackTrace()[1].getLineNumber() + ",  " + filename);
		Pcap pcap = Pcap.openOffline(filename, errbuf);
		
		if(pcap == null){
			System.err.printf("Error while opening file for capture" + errbuf.toString());
			return;
		}  
		
		Ethernet ethernet = new Ethernet();
		Tcp tcp = new Tcp();
		PcapHeader hdr = new PcapHeader(JMemory.POINTER);  
        JBuffer buf = new JBuffer(JMemory.POINTER); 
        
        /*************************************************************************** 
         * 我们必须将pcap’s data-link-type 映射到 jnetPcap‘s 协议id，
         * scanner需要这个id数据用来判断packet的第一个header是什么。
         * 
         * JRegistry 是协议的注册表，包括它们的类，运行时id，和相关的绑定，
         * 这个全局的注册表包括 绑定表，header scanner表和每个header的数字化id表；
         * 同时也提供一些查找和转化功能，比如吧header class 映射为 数字化id
         **************************************************************************/  
        int id = JRegistry.mapDLTToId(pcap.datalink());  
        
		/*------------------------ 解析pcap文件，提取特征  ------------------------*/  
		while(pcap.nextEx(hdr, buf) == Pcap.NEXT_EX_OK){
			
		   /****** 我们把header和buffer复制（指向）到新的packet对象中 *************/  
			PcapPacket packet = new PcapPacket(hdr, buf);
			
			/*********** 扫描packet ************/
			packet.scan(id);
//			if(packet.hasHeader(ethernet)){
//				packet.getHeader(ethernet);
//			}
		
			if(packet.hasHeader(tcp)){
				packet.getHeader(tcp);
	
				long frameNumber = packet.getFrameNumber();
				long time = packet.getCaptureHeader().timestampInMicros();
	
				if((frameNumber -lastNumber) == 1){
					
					double IAT = (double) ((time - lastTime)/(1000000.0*(frameNumber - lastNumber)));
					int  frameSize = packet.getCaptureHeader().wirelen();
					transRate = frameSize / IAT;
					//将解析的数据写入文件
					outputToFile(outputFilename, frameNumber, time, IAT, frameSize,transRate);
//					System.out.printf("Line number: %d, Frame No: %d, time: %d, lastTime: %d, IAT: %f\n", 
//							 		   Thread.currentThread().getStackTrace()[1].getLineNumber()
//							 		   , frameNumber, time, lastTime, IAT);
					
				}//end if((frameNumber -lastNumber) == 1)
	
				lastTime = time;
				lastNumber = frameNumber;
				
				if(frameNumber == 50)
					break;
				
			}//end if(packet.hasHeader(tcp))
			
		}//end while
	pcap.close();		
	
	} 
	
	public static void main(String[] args){

		final String DATA_PATH = "G:/git/graduate/data_set/";
		final String FILE_NAME = DATA_PATH +"jzp.pcap";	
		final String OUTPUT_FILE_NAME = "Data/jzp.txt";
		
		File outputFile = new File(OUTPUT_FILE_NAME);
		if(outputFile.exists()){
			outputFile.delete();
		}
		readPcap(FILE_NAME, OUTPUT_FILE_NAME);
	}//end main
	
}//end class
