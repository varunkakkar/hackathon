<?php

class Add_User_Data_Fields_To_Votes_Table {

	/**
	 * Make changes to the database.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::table('votes', function($table)
		{
			$table->string('email');
		});
	}

	/**
	 * Revert the changes to the database.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::table('votes', function($table)
		{
			$table->drop_column('email');
		});
	}

}
