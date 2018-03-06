package dev;


import java.io.File;
import java.io.IOException;

/**
 * 
 * @author ShengYuan
 *
 */

public class FileUtil {

	/**
	 * 
	 * @param filename
	 * @return
	 */
	public static File openOrCreateFile(String filename) {
		
		File f = new File(filename);
		if (!f.exists()) {
			try {
				f.createNewFile();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		return f;
	}
	
	public static File openOrCreateFile(String dirname, String filename) {
		
		File dir = new File(dirname);
		if (!dir.exists()) {
			dir.mkdirs();
		}
		return openOrCreateFile(dirname + "/" + filename);
		
	}
  	
  	//递归调用删除文件
  	public static void deleteRecursive(File file) {
  		if (file.isDirectory())
  		{
  			for (File child : file.listFiles())
  			{
  				deleteRecursive(child);
  			}
  		}
  		file.delete();
  	}
  	
  	public static int getDevNum() {
  		File dir = new File("Router");
		if (!dir.exists()) {
			return 0;
		}
		return dir.list().length;
	}
}

