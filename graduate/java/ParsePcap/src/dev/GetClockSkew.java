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


public class GetClockSkew {
	static long lastTime = 0;
	static double transRate = 0;
	static long lastNumber = 0;
	static long firstPacketTime;
    static long firstTcpTime;

	public static void outputToFile(String filename, long frameno,long time,double IAT,int size,double rate){
		File framaInfoFile = new File(filename);
		try {
			framaInfoFile.createNewFile();
			FileWriter writer = new FileWriter(framaInfoFile, true);   
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
	
	public static void getFirstTime(Pcap pcap){

		Tcp tcp = new Tcp();
		PcapHeader hdr = new PcapHeader(JMemory.POINTER);  
	    JBuffer buf = new JBuffer(JMemory.POINTER); 
	    

	    int id = JRegistry.mapDLTToId(pcap.datalink());  
	    
	    
		/*------------------------ 解析pcap文件，提取特征  ------------------------*/  
		while(pcap.nextEx(hdr, buf) == Pcap.NEXT_EX_OK){

		   /****** 我们把header和buffer复制（指向）到新的packet对象中 *************/  
			PcapPacket packet = new PcapPacket(hdr, buf);
			
			/*********** 扫描packet ************/
			packet.scan(id);
			
			
			long frameNumber = packet.getFrameNumber();
			if(frameNumber == 1){
				firstPacketTime = packet.getCaptureHeader().timestampInMicros();
//				System.out.println(firstPacketTime);
			}
			
			if(packet.hasHeader(tcp)){
				packet.getHeader(tcp);
				firstTcpTime = packet.getCaptureHeader().timestampInMicros();
//				System.out.println(firstTcpTime);
				break;

			}//end if(packet.hasHeader(tcp))
		
		}//end while
	}
		
	public static void main(String[] args){
	
		final String DATA_PATH = "G:/git/graduate/data_set/";
		final String FILE_NAME = DATA_PATH +"jzp.pcap";	
		final String OUTPUT_FILE_NAME = "Feature/jzp.txt";
		
		StringBuilder errbuf = new StringBuilder(); //For any error msgs
		
		/*------------------------ 打开文件 ------------------------*/  
		System.out.println(Thread.currentThread().getStackTrace()[1].getLineNumber() + ",  " + FILE_NAME);
		Pcap pcap = Pcap.openOffline(FILE_NAME, errbuf);
		
		if(pcap == null){
			System.err.printf("Error while opening file for capture" + errbuf.toString());
			return;
		}  
		getFirstTime(pcap);
		System.out.printf("Line number: %d, firstPacketTime: %d, firstTcpTime: %d\n", 
		   Thread.currentThread().getStackTrace()[1].getLineNumber()
		   , firstPacketTime, firstTcpTime);
//		System.out.println(firstPacketTime);
//		System.out.println(firstTcpTime);
		
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
			
			

			if(packet.hasHeader(tcp)){
				packet.getHeader(tcp);
				
				long frameNumber = packet.getFrameNumber();
				long ts = packet.getCaptureHeader().timestampInMicros();
				long x = ts - firstPacketTime;
				long v = ts - firstTcpTime;
				double w = 1/v;
				long y = v - x;
				System.out.printf("Line number: %d, frame number:%d, x: %d, y: %d\n", 
								   Thread.currentThread().getStackTrace()[1].getLineNumber(),
								   frameNumber, x, y);

//				long frameNumber = packet.getFrameNumber();
//				long ts = packet.getCaptureHeader().timestampInMicros();
	
			}//end if(packet.hasHeader(tcp))
		
		}//end while
		pcap.close();
	}//end main
}//end class

