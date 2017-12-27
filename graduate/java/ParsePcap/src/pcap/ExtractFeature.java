package pcap;


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


public class ExtractFeature {
	static long lastTime = 0;
	static double transRate = 0;
	static long lastNumber = 0;

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
	
	public static void main(String[] args){

		final String DATA_PATH = "G:/git/graduate/data_set/";
		final String FILE_NAME = DATA_PATH +"jzp.pcap";	
		final String OUTPUT_FILE_NAME = "Feature/jzp.txt";
		StringBuilder errbuf = new StringBuilder(); //For any error msgs
		
		/*------------------------ ���ļ� ------------------------*/  
		System.out.println(Thread.currentThread().getStackTrace()[1].getLineNumber() + ",  " + FILE_NAME);
		Pcap pcap = Pcap.openOffline(FILE_NAME, errbuf);
		
		if(pcap == null){
			System.err.printf("Error while opening file for capture" + errbuf.toString());
			return;
		}  
		
		Ethernet ethernet = new Ethernet();
		Tcp tcp = new Tcp();
		PcapHeader hdr = new PcapHeader(JMemory.POINTER);  
        JBuffer buf = new JBuffer(JMemory.POINTER); 
        
        /*************************************************************************** 
         * ���Ǳ��뽫pcap��s data-link-type ӳ�䵽 jnetPcap��s Э��id��
         * scanner��Ҫ���id���������ж�packet�ĵ�һ��header��ʲô��
         * 
         * JRegistry ��Э���ע����������ǵ��࣬����ʱid������صİ󶨣�
         * ���ȫ�ֵ�ע������ �󶨱�header scanner���ÿ��header�����ֻ�id��
         * ͬʱҲ�ṩһЩ���Һ�ת�����ܣ������header class ӳ��Ϊ ���ֻ�id
         **************************************************************************/  
        int id = JRegistry.mapDLTToId(pcap.datalink());  
        
		/*------------------------ ����pcap�ļ�����ȡ����  ------------------------*/  
		while(pcap.nextEx(hdr, buf) == Pcap.NEXT_EX_OK){
			
		   /****** ���ǰ�header��buffer���ƣ�ָ�򣩵��µ�packet������ *************/  
			PcapPacket packet = new PcapPacket(hdr, buf);
			
			/*********** ɨ��packet ************/
			packet.scan(id);
//			if(packet.hasHeader(ethernet)){
//				packet.getHeader(ethernet);
//			}
		
			if(packet.hasHeader(tcp)){
				packet.getHeader(tcp);
	
				long frameNumber = packet.getFrameNumber();
				long time = packet.getCaptureHeader().timestampInMicros();
//				int ack = packet.getCaptureHeader()
				System.out.println(tcp);
	
				if((frameNumber -lastNumber) == 1){
					
					double IAT = (double) ((time - lastTime)/(1000000.0*(frameNumber - lastNumber)));
					int  frameSize = packet.getCaptureHeader().wirelen();
					transRate = frameSize / IAT;
//					outputToFile(OUTPUT_FILE_NAME, frameNumber, time, IAT, frameSize,transRate);
//					System.out.printf("Line number: %d, Frame No: %d, time: %d, lastTime: %d, IAT: %f\n", 
//							 		   Thread.currentThread().getStackTrace()[1].getLineNumber()
//							 		   , frameNumber, time, lastTime, IAT);
					break;
				}//end if((frameNumber -lastNumber) == 1)
	
				lastTime = time;
				lastNumber = frameNumber;

			}//end if(packet.hasHeader(tcp))
		
		}//end while
	pcap.close();
	}//end main
}//end class
