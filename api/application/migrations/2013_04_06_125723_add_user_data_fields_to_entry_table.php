<?php

class Add_User_Data_Fields_To_Entry_Table {

	/**
	 * Make changes to the database.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::table('entries', function($table)
		{
			$table->string('email');
			$table->string('name')->nullable();
		});
	}

	/**
	 * Revert the changes to the database.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::table('entries', function($table)
		{
			$table->drop_column('email');
			$table->drop_column('name');
		});
	}

}
